import { getCachedResponse, cacheResponse, saveMessage, getHistory } from './cache';

export interface ChatResponse {
    text: string;
    source: 'cache' | 'api' | 'rule';
}

// Simple rule-based matcher for common questions
const checkRules = (question: string): string | null => {
    const lower = question.toLowerCase();
    if (lower.includes('hello') || lower.includes('hi ')) return "Hello! I'm your AI Tutor. How can I help you today?";
    if (lower.includes('your name')) return "I am Lumina, your personal AI learning assistant.";
    return null;
};

export const processMessage = async (question: string, userContext?: string): Promise<ChatResponse> => {
    // 1. Check local cache (Exact match)
    const cached = await getCachedResponse(question);
    if (cached) {
        return { text: cached.answer, source: 'cache' };
    }

    // 2. Check simple rules (Instant, 0 cost)
    const ruleAnswer = checkRules(question);
    if (ruleAnswer) {
        return { text: ruleAnswer, source: 'rule' };
    }

    // 3. Fallback to API (RAG + LLM)
    try {
        // [LOCAL] Prefix handling
        if (question.startsWith('[LOCAL]')) {
            const cleanQuestion = question.replace('[LOCAL]', '').trim();
            try {
                // Determine if we should send context to local? 
                // For now, local server might not expect it, but we can append it to message if needed.
                // Let's keep local simple for now, or append context to message if critical.
                // Re-reading task: "api replay based on user data".
                // We will append context to prompt for local as well.
                const fullMessage = userContext ? `Context:\n${userContext}\n\nQuestion: ${cleanQuestion}` : cleanQuestion;

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/tutor/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: fullMessage }),
                });
                const data = await res.json();
                return { text: data.response, source: 'api' };
            } catch (localErr) {
                return { text: "Local model is offline. Run 'serve.py'.", source: 'rule' };
            }
        }

        // Standard Cloud API
        const response = await fetch('/api/ai-tutor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question, userContext }), // Pass context
        });

        if (!response.ok) {
            console.error(`API Fault: Status ${response.status} ${response.statusText}`);
            const rawText = await response.text();
            console.error('API Fault: Raw Body:', `"${rawText}"`); // Quote it so we see empty strings

            let errData;
            try {
                if (!rawText.trim()) throw new Error("Empty body");
                errData = JSON.parse(rawText);
            } catch (jsonErr) {
                errData = { error: rawText || `HTTP Error ${response.status} (${response.statusText})` };
            }

            console.error('API Fault: Parsed Data:', errData);
            // Combine error and details for visibility
            const combinedError = errData.details ? `${errData.error}: ${errData.details}` : (errData.error || 'Unknown API Error');
            throw new Error(combinedError);
        }

        const data = await response.json();

        // Cache the result for next time
        await cacheResponse(question, data.answer);

        return { text: data.answer, source: 'api' };
    } catch (e: any) {
        console.error(e);
        let msg = e.message || "I'm having trouble connecting to my brain right now.";
        // Sanitize error message for branding
        msg = msg.replace(/Gemini/gi, 'Lumina Cloud').replace(/Google/gi, 'Lumina Cloud');
        return { text: `Error: ${msg}`, source: 'rule' };
    }
};
