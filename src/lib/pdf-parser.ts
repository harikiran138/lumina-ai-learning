// Use dynamic import to avoid SSR issues with canvas/DOMMatrix
export async function extractTextFromPDF(file: File): Promise<string> {
    if (typeof window === 'undefined') return '';

    try {
        // Dynamic import
        const pdfjsModule = await import('pdfjs-dist');
        // Handle ESM/CommonJS module difference
        const pdfjsLib = pdfjsModule.default || pdfjsModule;

        const version = pdfjsLib.version;
        const WORKER_SRC = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

        console.log(`Setting worker to: ${WORKER_SRC}`);
        pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        const numPages = pdf.numPages; // Process ALL pages
        console.log(`Extracting text from ${numPages} pages...`);

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');

            // Inject readable page marker
            fullText += `\n\n[[PAGE_${i}]]\n\n` + pageText;
        }

        return fullText;
    } catch (e: any) {
        console.error("PDF Parsing Error:", e);
        throw new Error("Failed to read PDF: " + e.message);
    }
}

// Interfaces for Structured Output
interface StructuredContent {
    type: 'paragraph' | 'list' | 'code' | 'warning' | 'tip';
    content: string;
}

interface StructuredTopic {
    title: string;
    goal: string;
    pageRef?: string;
    content: StructuredContent[];
    subtopics: any[];
}

interface StructuredModule {
    title: string;
    summary: string;
    topics: StructuredTopic[];
}

export async function extractStructuredData(file: File): Promise<StructuredModule[]> {
    if (typeof window === 'undefined') return [];

    try {
        const pdfjsModule = await import('pdfjs-dist');
        const pdfjsLib = pdfjsModule.default || pdfjsModule;
        const version = pdfjsLib.version;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const allItems: { str: string, h: number, page: number }[] = [];
        const heightFreq: { [key: number]: number } = {};

        // 1. Pass 1: Gather all text items and analyze font heights
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();

            for (const item of textContent.items as any[]) {
                const h = Math.round(item.transform[3]); // Font Height
                if (item.str.trim().length > 0) {
                    allItems.push({ str: item.str, h, page: i });
                    heightFreq[h] = (heightFreq[h] || 0) + 1;
                }
            }
        }

        // 2. Identify Body Text Height (Mode)
        let bodyHeight = 0;
        let maxCount = 0;
        for (const h in heightFreq) {
            if (heightFreq[h] > maxCount) {
                maxCount = heightFreq[h];
                bodyHeight = parseInt(h);
            }
        }
        console.log(`Detected Body Font Height: ${bodyHeight}`);

        // 3. Build Structure
        const modules: StructuredModule[] = [];
        let currentModule: StructuredModule | null = null;
        let currentTopic: StructuredTopic | null = null;

        // Default Module if none found initially
        if (allItems.length > 0) {
            currentModule = { title: "Introduction", summary: "Imported Content", topics: [] };
            modules.push(currentModule);
        }

        // Buffer for combining lines into paragraphs
        let paragraphBuffer: string[] = [];

        const flushParagraph = () => {
            if (paragraphBuffer.length > 0 && currentTopic) {
                const text = paragraphBuffer.join(' ');
                // Detect list items
                if (text.trim().startsWith('•') || text.trim().startsWith('-') || /^\d+\./.test(text.trim())) {
                    currentTopic.content.push({ type: 'list', content: text });
                } else {
                    currentTopic.content.push({ type: 'paragraph', content: text });
                }
                paragraphBuffer = [];
            }
        };

        for (const item of allItems) {
            const isHeading = item.h > bodyHeight * 1.2;
            const isModuleTitle = item.h > bodyHeight * 1.5; // Bigger heading = Module

            if (isModuleTitle) {
                flushParagraph();
                // Create New Module
                currentModule = {
                    title: item.str,
                    summary: "",
                    topics: []
                };
                modules.push(currentModule);

                // Also create a default topic for this module to catch immediate content
                currentTopic = {
                    title: "Overview",
                    goal: "Understand segment",
                    pageRef: item.page.toString(),
                    content: [],
                    subtopics: []
                };
                currentModule.topics.push(currentTopic);

            } else if (isHeading) {
                flushParagraph();
                // Create New Topic in current Module
                if (!currentModule) {
                    currentModule = { title: "General Content", summary: "", topics: [] };
                    modules.push(currentModule);
                }

                currentTopic = {
                    title: item.str,
                    goal: "Learn key concepts",
                    pageRef: item.page.toString(),
                    content: [],
                    subtopics: []
                };
                currentModule.topics.push(currentTopic);

            } else {
                // Body Text
                if (!currentTopic) {
                    if (!currentModule) {
                        currentModule = { title: "Document Start", summary: "", topics: [] };
                        modules.push(currentModule);
                    }
                    currentTopic = {
                        title: "Introductory Text",
                        goal: "Introduction",
                        pageRef: item.page.toString(),
                        content: [],
                        subtopics: []
                    };
                    currentModule.topics.push(currentTopic);
                }

                // Check if it's a new line/paragraph break based on implicit logic or simply accumulate
                // For PDF, simple accumulation is often safest unless position jumps. 
                // We'll just accumulate for now.
                paragraphBuffer.push(item.str);
            }
        }
        flushParagraph(); // Final flush

        return modules;

    } catch (e: any) {
        console.error("Structured Parsing Error:", e);
        throw new Error("Failed to parse PDF structure: " + e.message);
    }
}
