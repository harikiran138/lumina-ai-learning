
// Scripts usually run in node, so we need to handle imports
// This script simulates the AI pipeline flow with a mock engine

import { chunkPages, extractSectionsFromChunk, mergeSectionsToCourse } from '../src/lib/ai-pipeline';

// Mock types
interface MockMessage {
    role: string;
    content: string;
}

// Mock Engine
const mockEngine = {
    chat: {
        completions: {
            create: async (params: any) => {
                const prompt = params.messages[0].content;

                // Simulate Extraction output
                if (prompt.includes("Course Content Extractor")) {
                    return {
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    sections: [
                                        {
                                            title: "Simulated Section",
                                            summary: "A summary of this section.",
                                            subsections: [
                                                {
                                                    title: "Subsection 1",
                                                    contentBlocks: [{ type: "paragraph", data: "Some content here." }]
                                                }
                                            ]
                                        }
                                    ]
                                })
                            }
                        }]
                    };
                }

                // Simulate Merge output (Map-Reduce)
                if (prompt.includes("Curriculum Architect")) {
                    // Start expecting a list of input topics
                    // We need to be careful: the prompt contains JSON.stringify(minimizedSections)
                    // We can extract IDs from the prompt to verify batching logic?

                    // Simple regex to find IDs in prompt to demonstrate we received them
                    const ids = prompt.match(/sec-\d+/g) || [];
                    console.log(`    [Mock Engine] Received prompt with ${ids.length} items to merge.`);

                    // Return a valid module structure using those IDs
                    const topics = ids.map((id: string, i: number) => ({
                        title: `Merged Topic ${i}`,
                        sourceId: id,
                        goal: "Learning Goal"
                    }));

                    return {
                        choices: [{
                            message: {
                                content: JSON.stringify({
                                    modules: [
                                        {
                                            title: "Generated Module",
                                            summary: "Module Summary",
                                            topics: topics
                                        }
                                    ]
                                })
                            }
                        }]
                    };
                }

                return { choices: [{ message: { content: "{}" } }] };
            }
        }
    },
    resetChat: async () => { /* No-op */ }
};

// Test Runner
async function runTest() {
    console.log("=== Starting AI Pipeline Scalability Test ===");

    // 1. Generate Massive Input (e.g., 50 simulated pages)
    console.log("1. Generating 100k characters of text...");
    const pages = [];
    for (let i = 1; i <= 50; i++) {
        pages.push({
            page: i,
            text: `Page ${i} content ` + "test ".repeat(200) // ~1k chars per page
        });
    }

    // 2. Chunking
    console.log("2. Chunking (maxChars=2000)...");
    const chunks = chunkPages(pages, 2000);
    console.log(`   Result: ${chunks.length} chunks created.`);

    // 3. Extraction (Pass 1)
    console.log("3. Running Pass 1: Extraction (Simulated)...");
    let allSections: any[] = [];

    // Simulate processing loop
    for (let i = 0; i < chunks.length; i++) {
        // Just calling our mock engine
        const result = await extractSectionsFromChunk(chunks[i].text, mockEngine as any);
        if (result && result.sections) {
            allSections.push(...result.sections);
        }
        if (i % 10 === 0) process.stdout.write('.');
    }
    console.log(`\n   Pass 1 Complete. Extracted ${allSections.length} sections.`);

    // 4. Merging (Pass 2 - Map/Reduce/Batching)
    console.log("4. Running Pass 2: Merge (Batched)...");
    try {
        const course = await mergeSectionsToCourse(allSections, mockEngine as any);

        console.log("=== Test Results ===");
        if (course && course.modules && course.modules.length > 0) {
            const totalTopics = course.modules.reduce((acc: number, m: any) => acc + m.topics.length, 0);
            console.log(`✅ SUCCESS: Course Generated.`);
            console.log(`   Modules: ${course.modules.length}`);
            console.log(`   Total Topics: ${totalTopics}`);
            console.log(`   (Should verify that totalTopics matches input sections if 1-to-1)`);

            if (totalTopics === allSections.length) {
                console.log("✅ Perfect Integrity: Input count matches Output count.");
            } else {
                console.log(`⚠️ Count Mismatch: Input ${allSections.length} vs Output ${totalTopics}`);
            }

            // Dump a sample to check hydration
            const sampleTopic = course.modules[0].topics[0];
            if (sampleTopic.content && sampleTopic.content.length > 0) {
                console.log("✅ Hydration Check: Topics have content.");
            } else {
                console.log("❌ Hydration Failed: Topics missing content.");
            }

        } else {
            console.error("❌ FAILED: No modules generated.");
        }
    } catch (e) {
        console.error("❌ CRITICAL FAILURE during Merge:", e);
    }
}

runTest();
