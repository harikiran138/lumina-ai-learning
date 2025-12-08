export interface CourseNode {
    id: string; // Unique ID (e.g., "unit-1", "ch-1.2")
    type: 'root' | 'textbook_part' | 'unit' | 'chapter' | 'section' | 'topic';
    title: string;
    pageRange?: { start: number; end: number }; // The physical pages in PDF (1-based)
    content?: string[]; // The actual text content (paragraphs)
    children: CourseNode[]; // Recursive children
}

export interface TextbookMap {
    title: string;
    structure: CourseNode;
}
