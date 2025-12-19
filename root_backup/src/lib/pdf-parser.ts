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
        // Use standard CDN for worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        const allLines: { text: string, h: number, y: number, page: number, isBold: boolean }[] = [];
        const heightFreq: { [key: number]: number } = {};

        // 1. Pass 1: Extract items and Group by Line (Y-coord)
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Get font styles to check for 'Bold'
            const styles = textContent.styles;

            const rawItems = (textContent.items as any[]).map(item => ({
                str: item.str,
                h: Math.round(item.transform[3]), // Font Height
                y: Math.round(item.transform[5]), // Y-coord (0 is bottom)
                fontName: item.fontName,
                hasEOL: item.hasEOL
            }));

            // Sort by Y (descending -> top to bottom), then X (ascending -> left to right)
            // Note: raw textContent is usually already sorted, but PDF Y is inverted (0 at bottom). 
            // We group by Y tolerance.

            let currentLineY = -1;
            let currentLineText: string[] = [];
            let currentLineMaxH = 0;
            let currentLineIsBold = false;

            // Simple line grouper
            for (const item of rawItems) {
                // If Item is on a new visual line (allow 2px tolerance) or explicitly marked EOL
                if (currentLineY === -1 || Math.abs(item.y - currentLineY) > 5) {
                    // Flush old line
                    if (currentLineText.length > 0) {
                        allLines.push({
                            text: currentLineText.join(' ').trim(),
                            h: currentLineMaxH,
                            y: currentLineY,
                            page: i,
                            isBold: currentLineIsBold
                        });
                    }
                    // Start new line
                    currentLineY = item.y;
                    currentLineText = [item.str];
                    currentLineMaxH = item.h;
                    currentLineIsBold = styles[item.fontName]?.fontFamily?.includes('Bold') || item.fontName.includes('Bold') || false;
                } else {
                    // Append to current line
                    currentLineText.push(item.str);
                    currentLineMaxH = Math.max(currentLineMaxH, item.h);
                    if (!currentLineIsBold) {
                        currentLineIsBold = styles[item.fontName]?.fontFamily?.includes('Bold') || item.fontName.includes('Bold') || false;
                    }
                }
            }
            // Flush last line of page
            if (currentLineText.length > 0) {
                allLines.push({
                    text: currentLineText.join(' ').trim(),
                    h: currentLineMaxH,
                    y: currentLineY,
                    page: i,
                    isBold: currentLineIsBold
                });
            }

            // Collect stats for Body Text detection
            for (const item of rawItems) {
                if (item.str.trim()) {
                    heightFreq[item.h] = (heightFreq[item.h] || 0) + 1;
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

        // 3. Build Structure with Strict Rules
        const modules: StructuredModule[] = [];
        let currentModule: StructuredModule | null = null;
        let currentTopic: StructuredTopic | null = null;

        // Regex Patterns
        const MODULE_PATTERN = /(UNIT|MODULE|CHAPTER)\s+[IVX0-9]+/i; // e.g. "UNIT I", "Chapter 5"
        const TOPIC_PATTERN = /^\d+\.\d+/; // e.g. "1.2 Types of Networks"

        // Helper to init structures
        const ensureModule = (title: string = "Introduction") => {
            if (!currentModule) {
                currentModule = { title, summary: "", topics: [] };
                modules.push(currentModule);
            }
        };
        const ensureTopic = (title: string = "Overview", page: number) => {
            ensureModule();
            if (!currentTopic || currentTopic.title !== title) {
                currentTopic = {
                    title,
                    goal: "Learn section content",
                    pageRef: page.toString(),
                    content: [],
                    subtopics: []
                };
                currentModule!.topics.push(currentTopic);
            }
        };

        for (const line of allLines) {
            if (!line.text) continue;

            const isBig = line.h > bodyHeight * 1.1;
            const isHuge = line.h > bodyHeight * 1.4;

            // Rule 1: Module Detection (Strict Pattern OR Huge Font)
            if (MODULE_PATTERN.test(line.text) || isHuge) {
                currentModule = {
                    title: line.text,
                    summary: "",
                    topics: []
                };
                modules.push(currentModule);
                currentTopic = null; // Reset topic
                continue;
            }

            // Rule 2: Lesson/Topic Detection (Numbered Pattern OR Big+Bold)
            if (TOPIC_PATTERN.test(line.text) || (isBig && line.isBold)) {
                ensureModule();
                currentTopic = {
                    title: line.text,
                    goal: "Section details",
                    pageRef: line.page.toString(),
                    content: [],
                    subtopics: []
                };
                currentModule!.topics.push(currentTopic);
                continue;
            }

            // Rule 3: Subtopic / Key Point (Bold but not big, or dashed list)
            // Just treat as content with special type for now to match UI schema
            ensureTopic("General Content", line.page);

            if (line.text.trim().startsWith('•') || line.text.trim().startsWith('-')) {
                currentTopic!.content.push({ type: 'list', content: line.text });
            } else if (line.isBold && !isBig) {
                // Inline header / subtopic
                currentTopic!.content.push({ type: 'paragraph', content: `**${line.text}**` });
            } else {
                currentTopic!.content.push({ type: 'paragraph', content: line.text });
            }
        }

        return modules;

        return modules;

    } catch (e: any) {
        console.error("Structured Parsing Error:", e);
        throw new Error("Failed to parse PDF structure: " + e.message);
    }
}

/**
 * Extracts text from the first N pages (usually for TOC analysis).
 */
export async function extractFirstNPages(file: File, n: number = 20): Promise<string> {
    if (typeof window === 'undefined') return '';

    try {
        const pdfjsModule = await import('pdfjs-dist');
        const pdfjsLib = pdfjsModule.default || pdfjsModule;
        const version = pdfjsLib.version;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        const limit = Math.min(n, pdf.numPages);

        for (let i = 1; i <= limit; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `\n\n[[PAGE_${i}]]\n` + pageText;
        }

        return fullText;
    } catch (e: any) {
        console.error("PDF TOC Extraction Error:", e);
        throw new Error("Failed to read PDF TOC: " + e.message);
    }
}

/**
 * Extracts text from a specific range of pages (inclusive).
 */
export async function extractPageRange(file: File, start: number, end: number): Promise<string> {
    if (typeof window === 'undefined') return '';

    try {
        const pdfjsModule = await import('pdfjs-dist');
        const pdfjsLib = pdfjsModule.default || pdfjsModule;
        const version = pdfjsLib.version;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.js`;

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;

        let fullText = '';
        // Ensure bounds
        const startPage = Math.max(1, start);
        const endPage = Math.min(pdf.numPages, end);

        for (let i = startPage; i <= endPage; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Basic join for content
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += `\n` + pageText;
        }

        return fullText;
    } catch (e: any) {
        console.error("PDF Range Extraction Error:", e);
        throw new Error(`Failed to extract pages ${start}-${end}: ` + e.message);
    }
}
