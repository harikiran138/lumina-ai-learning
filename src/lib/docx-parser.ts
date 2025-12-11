import mammoth from 'mammoth';

/**
 * Extracts raw text from a DOCX file using Mammoth.
 * @param file The uploaded DOCX file.
 * @returns The extracted raw text string.
 */
export async function extractTextFromDocx(file: File): Promise<string> {
    if (typeof window === 'undefined') return '';

    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        return result.value || '';
    } catch (e: any) {
        console.error("DOCX Parsing Error:", e);
        throw new Error("Failed to read DOCX: " + e.message);
    }
}
