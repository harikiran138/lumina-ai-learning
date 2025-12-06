'use server';

export async function chatWithAI(messages: any[]) {
    try {
        const apiKey = process.env.AI_API_KEY;

        if (!apiKey) {
            return {
                success: false,
                error: 'AI API Key is not configured on the server.'
            };
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://lumina-learning.com', // Placeholder
                'X-Title': 'Lumina AI Tutor'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free', // Default to free model, can be env var too
                messages: [
                    { role: 'system', content: 'You are an AI Tutor for students. Be helpful, concise, and educational.' },
                    ...messages
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);
            return {
                success: false,
                error: `AI Provider Error (${response.status}): ${errorText.substring(0, 100)}...`
            };
        }

        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content || "Sorry, I couldn't understand that.";

        return { success: true, message: aiText };

    } catch (error) {
        console.error('Server AI Action Error:', error);
        return { success: false, error: 'Internal server error during AI request.' };
    }
}
