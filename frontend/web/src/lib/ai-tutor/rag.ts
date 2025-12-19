// Simple in-memory Knowledge Base for PoC
// In a real app, this would be a Vector DB (Pinecone/Milvus)

const KNOWLEDGE_BASE = [
    {
        id: '1',
        text: "Newton's First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force.",
        keywords: ['newton', 'first law', 'motion', 'inertia']
    },
    {
        id: '2',
        text: "Newton's Second Law defines the relationship between force, mass, and acceleration as F = ma.",
        keywords: ['newton', 'second law', 'force', 'mass', 'acceleration']
    },
    {
        id: '3',
        text: "Newton's Third Law states that for every action, there is an equal and opposite reaction.",
        keywords: ['newton', 'third law', 'action', 'reaction']
    },
    {
        id: '4',
        text: "Mitosis is the process where a single cell divides into two identical daughter cells (cell division).",
        keywords: ['mitosis', 'cell', 'division', 'biology']
    },
    {
        id: '5',
        text: "Photosynthesis is the process used by plants to convert light energy into chemical energy.",
        keywords: ['photosynthesis', 'plants', 'energy', 'light']
    }
];

export const retrieveContext = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();

    // Simple keyword matching for retrieval
    // Real implementation: Compute embedding of query -> Cosine Similarity with chunks

    const relevantChunks = KNOWLEDGE_BASE.filter(chunk =>
        chunk.keywords.some(k => lowerQuery.includes(k)) ||
        chunk.text.toLowerCase().includes(lowerQuery)
    );

    if (relevantChunks.length === 0) return "";

    return relevantChunks
        .map(c => `- ${c.text}`)
        .join('\n');
};
