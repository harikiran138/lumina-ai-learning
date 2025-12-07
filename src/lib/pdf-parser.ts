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
