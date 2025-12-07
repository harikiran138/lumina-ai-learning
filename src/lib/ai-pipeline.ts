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

export function chunkPages(pages: PageText[], maxChars = 12000): { text: string, startPage: number, endPage: number }[] {
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

        // Sanitize: Fix common bad escapes (e.g., single backslashes in paths or text)
        // Regex looks for backslash NOT followed by valid escape chars (", \, /, b, f, n, r, t, u)
        jsonString = jsonString.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

        try {
            return JSON.parse(jsonString);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            console.log("Failed JSON:", jsonString);

            // Aggressive Repair attempt:
            // Sometimes models output newlines as literal \n, sometimes as actual newlines
            // We can try to strip control chars or aggressive replace if specific error known
            return {};
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

// Pass 2: Merge into Course
export async function mergeSectionsToCourse(allSections: any[], engine: MLCEngineInterface): Promise<any> {
    // If we have nothing, abort
    if (!allSections || allSections.length === 0) throw new Error("No sections to merge.");

    const prompt = `
You are a Curriculum Architect.
Organize the following list of extracted sections into a coherent Course Structure (Modules > Topics > Subtopics).

Input Sections:
${JSON.stringify(allSections, null, 2)}

Output JSON format (Course Schema):
{
    "modules": [
        {
            "title": "Module Title",
            "summary": "Module Summary",
            "topics": [
                {
                    "title": "Topic Title",
                    "goal": "Topic Learning Goal",
                    "subtopics": [
                        {
                            "title": "Subtopic Title",
                            "contentBlocks": [
                                { "type": "paragraph", "data": "..." } 
                                // Maintain original content blocks where possible
                            ]
                        }
                    ]
                }
            ]
        }
    ]
}

Rules:
1. Merge related sections into Modules.
2. Keep the contentBlocks intact.
3. Output valid JSON only.
`;
    // Note: If input is too huge, we might need to simplify contentBlocks for the prompt, 
    // but assuming 128k context window (gpt-oss) or 8k (llama3.1), we try to fit headers first?
    // For now, let's try sending full structure. If too big, we just send structure and re-map content manually? 
    // To be safe/simple for now: we blindly send it.

    // Optimization: If payload is massive, we can strip contentBlocks from prompt and ask AI to group by "ID", 
    // then re-hydrate. But let's trust the large model first.

    const result = await callWebLLM(engine, prompt);
    return CourseSchema.parse(result);
}
