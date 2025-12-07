import { z } from "zod";
// Import type for safety - usually available from the library, 
// using 'any' for simplicity if types conflict, but prefer interface.
import { type MLCEngineInterface } from "@mlc-ai/web-llm";

// --- Schemas ---

export const ContentBlockSchema = z.object({
    type: z.enum(["paragraph", "list", "code", "tip", "warning"]),
    data: z.string() // Content string
});

export const SubtopicSchema = z.object({
    title: z.string(),
    contentBlocks: z.array(ContentBlockSchema)
});

export const TopicSchema = z.object({
    title: z.string(),
    goal: z.string().optional(),
    subtopics: z.array(SubtopicSchema).optional(),
    // Fallback if AI flattens structure
    content: z.array(ContentBlockSchema).optional()
});

export const ModuleSchema = z.object({
    title: z.string(),
    summary: z.string().optional(),
    topics: z.array(TopicSchema)
});

export const CourseSchema = z.object({
    modules: z.array(ModuleSchema)
});

// Intermediate Schema for Pass 1
export const SectionSchema = z.object({
    sections: z.array(z.object({
        title: z.string(),
        summary: z.string().optional(),
        subsections: z.array(z.object({
            title: z.string(),
            contentBlocks: z.array(ContentBlockSchema)
        }))
    }))
});

// --- Types ---
export type PageText = {
    page: number;
    text: string;
};

// --- Logic ---

export function chunkPages(pages: PageText[], maxChars = 20000): { text: string, startPage: number, endPage: number }[] {
    const chunks: { text: string, startPage: number, endPage: number }[] = [];

    // Flatten all text first since we might have one huge page
    let fullText = "";
    // We lose precise page mapping if we just flatten, but for this AI it's fine.
    // Better strategy: iterate pages, add to buffer. If buffer > max, split.

    let currentChunk = "";
    let chunkStartPage = pages[0]?.page || 1;

    for (const p of pages) {
        const pageContent = `\n=== PAGE ${p.page} ===\n${p.text}\n`;

        // If adding this page exceeds limit...
        if (currentChunk.length + pageContent.length > maxChars) {
            // Check if current chunk has content to push
            if (currentChunk.length > 0) {
                chunks.push({
                    text: currentChunk,
                    startPage: chunkStartPage,
                    endPage: p.page - 1
                });
                currentChunk = "";
                chunkStartPage = p.page;
            }

            // Now, is the NEW page itself too big?
            if (pageContent.length > maxChars) {
                // We must split this single page
                let remaining = pageContent;
                while (remaining.length > 0) {
                    const slice = remaining.slice(0, maxChars);
                    chunks.push({
                        text: slice,
                        startPage: p.page,
                        endPage: p.page
                    });
                    remaining = remaining.slice(maxChars);
                }
                // Reset for next
                currentChunk = "";
                chunkStartPage = p.page + 1; // Approximate
            } else {
                // It fits in a fresh chunk
                currentChunk = pageContent;
                chunkStartPage = p.page;
            }
        } else {
            // Fits in current chunk
            if (currentChunk.length === 0) chunkStartPage = p.page;
            currentChunk += pageContent;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push({
            text: currentChunk,
            startPage: chunkStartPage,
            endPage: pages[pages.length - 1]?.page || chunkStartPage
        });
    }

    return chunks;
}

// Logic replaced: Calls specific engine instance provided by the UI
async function callWebLLM(engine: MLCEngineInterface, prompt: string): Promise<any> {
    try {
        // Critical: Reset chat history so we don't accumulate tokens across chunks in the loop
        if (engine.resetChat) {
            await engine.resetChat();
        }

        const reply = await engine.chat.completions.create({
            messages: [
                { role: "user", content: prompt }
            ],
            stream: false
            // Removed strict response_format as it can confuse smaller quantized models
        });

        const content = reply.choices[0].message.content || "{}";

        // Robust JSON Extraction
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
            console.warn("No JSON braces found in AI response:", content.substring(0, 100));
            return {};
        }

        let jsonString = content.substring(firstBrace, lastBrace + 1);

        try {
            // Dynamic import to avoid build issues if types are missing
            const { jsonrepair } = await import('jsonrepair');
            return JSON.parse(jsonrepair(jsonString));
        } catch (repairError) {
            console.warn("jsonrepair failed, falling back to raw parse", repairError);
            try {
                return JSON.parse(jsonString);
            } catch (parseError) {
                console.error("Final JSON Parse Error:", parseError);
                console.log("Failed JSON:", jsonString);
                return {};
            }
        }

    } catch (e: any) {
        console.error("WebLLM Call Failed", e);
        throw e;
    }
}

// Pass 1: Extract Local Sections
export async function extractSectionsFromChunk(chunkText: string, engine: MLCEngineInterface): Promise<any> {
    const prompt = `
You are a Course Content Extractor.
Analyize the text and extract the educational topics.

Output JSON only:
{
  "sections": [
    {
      "title": "Exact Section Title",
      "summary": "One sentence summary",
      "subsections": [
        {
          "title": "Subsection Title",
          "contentBlocks": [
            { "type": "paragraph", "data": "Main content text..." },
            { "type": "list", "data": "- Point 1\\n- Point 2" }
          ]
        }
      ]
    }
  ]
}

TEXT:
${chunkText}
`;
    // Retry logic basic
    try {
        const result = await callWebLLM(engine, prompt);

        // Validation attempt
        const parsed = SectionSchema.safeParse(result);
        if (parsed.success) {
            return parsed.data;
        } else {
            console.warn("Schema validation failed, but using partial data:", parsed.error);
            // Identify if 'sections' exists at least
            if (result && Array.isArray(result.sections)) {
                return result; // Return unvalidated shape if it looks okay-ish
            }
            return { sections: [] };
        }
    } catch (e) {
        console.warn("Chunk extraction failed completely:", e);
        return { sections: [] };
    }
}

// Pass 2: Merge into Course (Map-Reduce Strategy with Batching)
export async function mergeSectionsToCourse(allSections: any[], engine: MLCEngineInterface): Promise<any> {
    // If we have nothing, abort
    if (!allSections || allSections.length === 0) throw new Error("No sections to merge.");

    // 1. Map: Creation - Assign IDs and strip content
    const sectionMap = new Map<string, any>();
    const minimizedSections = allSections.map((sec, idx) => {
        const id = `sec-${idx}`;
        sectionMap.set(id, sec);
        return {
            id: id,
            title: sec.title,
            summary: sec.summary || ""
        };
    });

    // 2. Batching: Split into chunks of 20 to fit context window
    const BATCH_SIZE = 20;
    const batches = [];
    for (let i = 0; i < minimizedSections.length; i += BATCH_SIZE) {
        batches.push(minimizedSections.slice(i, i + BATCH_SIZE));
    }

    let allModules: any[] = [];

    // 3. Reduce: Process each batch
    // We process sequentially to not overload the single GPU engine instance
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        const prompt = `
You are a Curriculum Architect.
Organize the following list of extracted topics into a coherent Course Structure (Modules > Topics).
You MUST use the provided IDs to reference the content.

Input Topics (Batch ${i + 1}/${batches.length}):
${JSON.stringify(batch, null, 2)}

Output JSON format:
{
    "modules": [
        {
            "title": "Module Title", // Group related topics
            "summary": "Module Summary",
            "topics": [
                {
                    "title": "Topic Title", 
                    "sourceId": "sec-0", // CRITICAL: Must match Input ID
                    "goal": "Learning Goal"
                }
            ]
        }
    ]
}

Rules:
1. Group related topics into Modules.
2. If topics don't fit existing modules, create new ones.
3. EVERY topic from input must be included exactly once.
4. Output valid JSON.
`;

        try {
            const result = await callWebLLM(engine, prompt);
            if (result && result.modules) {
                allModules = [...allModules, ...result.modules];
            }
        } catch (err) {
            console.error(`Batch ${i} failed to merge`, err);
            // Fallback: Create a generic module for this batch to ensure no data loss
            const fallbackModule = {
                title: `Unmerged Content (Part ${i + 1})`,
                summary: "Content that could not be auto-organized.",
                topics: batch.map(b => ({
                    title: b.title,
                    sourceId: b.id,
                    goal: "Review this content"
                }))
            };
            allModules.push(fallbackModule);
        }
    }

    // 4. Re-hydrate: Merge content back in
    const hydratedModules = allModules.map((mod: any) => ({
        ...mod,
        topics: mod.topics?.map((topic: any) => {
            const original = sectionMap.get(topic.sourceId);

            // Default content if mapping fails
            let content = [{ type: 'paragraph', data: 'Content placeholder' }];
            let subtopics = [];

            if (original) {
                subtopics = original.subsections || [];

                if (original.summary) {
                    content = [{ type: 'paragraph', data: original.summary }];
                } else if (subtopics.length > 0 && subtopics[0].contentBlocks) {
                    content = [{ type: 'paragraph', data: `Overview of ${original.title}` }];
                }
            }

            return {
                title: topic.title || original?.title || "Untitled",
                goal: topic.goal || "Learn this topic",
                content: content,
                subtopics: subtopics
            };
        })
    }));

    return CourseSchema.parse({ modules: hydratedModules });
}
