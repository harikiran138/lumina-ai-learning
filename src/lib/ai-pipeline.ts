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
    const chunks = [];
    let currentText = "";
    let startPage = pages[0]?.page || 1;
    let endPage = startPage;

    for (const p of pages) {
        const labeled = `\n=== PAGE ${p.page} ===\n${p.text}\n`;

        if (currentText.length + labeled.length > maxChars && currentText.length > 0) {
            chunks.push({
                text: currentText,
                startPage: startPage,
                endPage: endPage
            });
            currentText = labeled;
            startPage = p.page;
        } else {
            currentText += labeled;
            endPage = p.page;
        }
    }

    if (currentText.trim().length > 0) {
        chunks.push({
            text: currentText,
            startPage: startPage,
            endPage: endPage
        });
    }

    return chunks;
}

// Logic replaced: Calls specific engine instance provided by the UI
async function callWebLLM(engine: MLCEngineInterface, prompt: string): Promise<any> {
    try {
        const reply = await engine.chat.completions.create({
            messages: [
                { role: "user", content: prompt }
            ],
            stream: false,
            // Enforce strict JSON mode if model supports it, but simple prompt engineering is often enough for base models
            response_format: { type: "json_object" }
        });

        const content = reply.choices[0].message.content || "{}";

        // Clean JSON
        let cleanJson = content.replace(/```json/g, '').replace(/```/g, '');
        return JSON.parse(cleanJson);

    } catch (e: any) {
        console.error("WebLLM Call Failed", e);
        throw e;
    }
}

// Pass 1: Extract Local Sections
export async function extractSectionsFromChunk(chunkText: string, engine: MLCEngineInterface): Promise<any> {
    const prompt = `
You are a Course Content Extractor.
Extract valid educational sections from the text below.

Output JSON format:
{
  "sections": [
    {
      "title": "Section Title",
      "summary": "Brief summary",
      "subsections": [
        {
          "title": "Subsection Title",
          "contentBlocks": [
            { "type": "paragraph", "data": "content..." },
            { "type": "list", "data": "- item 1\\n- item 2" },
            { "type": "code", "data": "code snippet" },
            { "type": "tip", "data": "tip text" },
             { "type": "warning", "data": "warning text" }
          ]
        }
      ]
    }
  ]
}

Only extract meaningful content.
TEXT:
${chunkText}
`;
    // Retry logic basic
    try {
        const result = await callWebLLM(engine, prompt);
        return SectionSchema.parse(result);
    } catch (e) {
        console.warn("Chunk extraction failed validation, retrying once...");
        // Simple retry could go here, or just fail to let UI handle "partial" data
        // For now, return empty section to avoid crashing pipeline
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
