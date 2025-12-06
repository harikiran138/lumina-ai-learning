import * as pdfjsLib from 'pdfjs-dist';

// Define the worker src relative to the installed version or use a CDN
// Using generic CDN for simplicity in this environment
const WORKER_SRC = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;

export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';
    const numPages = Math.min(pdf.numPages, 20); // Limit to first 20 pages (usually TOC is here)

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
    }

    return fullText;
}
