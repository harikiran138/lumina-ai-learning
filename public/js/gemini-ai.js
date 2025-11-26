/**
 * Gemini AI Service - Integration with Google's Gemini API
 */

class GeminiAI {
    constructor(apiKey = null) {
        // Default API key - replace this with your actual Gemini API key
        this.defaultApiKey = 'AIzaSyDw3gXYit00XFm2YpQ1bE9SuQ3oVtPzudI'; // Replace with your actual API key
        
        this.apiKey = apiKey || this.getStoredApiKey() || this.defaultApiKey;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
        this.conversationHistory = [];
        this.maxHistoryLength = 10; // Keep last 10 messages for context
    }

    // Get API key from localStorage or use default
    getStoredApiKey() {
        return localStorage.getItem('gemini_api_key') || this.defaultApiKey;
    }

    // Set or update API key
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
    }

    // Clear stored API key
    clearApiKey() {
        localStorage.removeItem('gemini_api_key');
        this.apiKey = null;
    }

    // Add educational context to the system prompt
    getSystemPrompt() {
        return `You are an AI Tutor for the Lumina educational platform. You are knowledgeable, friendly, and helpful. 

Your role is to:
- Help students understand concepts across various subjects
- Provide clear explanations with examples
- Offer practice problems and solutions
- Encourage learning and critical thinking
- Adapt your teaching style to the student's level

Guidelines:
- Keep responses concise but comprehensive
- Use examples and analogies when helpful
- Ask follow-up questions to gauge understanding
- Be encouraging and supportive
- If unsure about something, say so and suggest reliable sources

Student Context: You are currently helping a student in their learning journey. Tailor your responses to be educational and supportive.`;
    }

    // Add message to conversation history
    addToHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        // Keep only recent messages to stay within API limits
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
        }
    }

    // Prepare conversation context for API
    prepareConversationContext() {
        const systemPrompt = this.getSystemPrompt();
        
        // Format conversation for Gemini API
        const parts = [{ text: systemPrompt }];
        
        // Add conversation history
        this.conversationHistory.forEach(msg => {
            if (msg.role === 'user') {
                parts.push({ text: `Student: ${msg.content}` });
            } else {
                parts.push({ text: `AI Tutor: ${msg.content}` });
            }
        });

        return parts;
    }

    // Generate response using Gemini API
    async generateResponse(userMessage) {
        console.log('🤖 Generating response for:', userMessage);
        console.log('🔑 Using API key:', this.apiKey ? (this.apiKey.substring(0, 10) + '...') : 'Not set');
        
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured. Please set your API key first.');
        }

        try {
            // Add user message to history
            this.addToHistory('user', userMessage);

            // Prepare the request with educational context
            const systemPrompt = this.getSystemPrompt();
            const fullMessage = `${systemPrompt}\n\nStudent: ${userMessage}\n\nAI Tutor:`;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: fullMessage
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000,
                    topP: 0.8,
                    topK: 40
                }
            };

            // Make API request
            console.log('📤 Sending request to Gemini API...');
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-goog-api-key': this.apiKey
                },
                body: JSON.stringify(requestBody)
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('❌ API Error:', response.status, errorData);
                throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('✅ API Response received:', data);
            
            // Extract the response text
            const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!aiResponse) {
                throw new Error('No response generated from Gemini API');
            }

            // Add AI response to history
            this.addToHistory('assistant', aiResponse);

            return aiResponse;

        } catch (error) {
            console.error('Gemini AI Error:', error);
            
            // Handle specific error cases
            if (error.message.includes('API key not valid')) {
                this.clearApiKey();
                throw new Error('Invalid API key. Please check your Gemini API key and try again.');
            } else if (error.message.includes('quota exceeded')) {
                throw new Error('API quota exceeded. Please try again later or check your Gemini API usage.');
            } else if (error.message.includes('safety')) {
                throw new Error('Response blocked by safety filters. Please rephrase your question.');
            }
            
            throw error;
        }
    }

    // Get a quick educational response for specific subjects
    async getSubjectHelp(subject, topic, question = null) {
        const subjectPrompts = {
            math: `Help with ${topic} in mathematics. ${question ? `Specific question: ${question}` : 'Provide an overview and examples.'}`,
            science: `Explain ${topic} in science. ${question ? `Question: ${question}` : 'Include key concepts and real-world applications.'}`,
            history: `Discuss ${topic} in history. ${question ? `Question: ${question}` : 'Provide context and significance.'}`,
            literature: `Analyze ${topic} in literature. ${question ? `Question: ${question}` : 'Include themes and literary devices.'}`,
            language: `Help with ${topic} in language learning. ${question ? `Question: ${question}` : 'Provide examples and practice.'}`,
        };

        const prompt = subjectPrompts[subject.toLowerCase()] || 
                      `Help the student understand ${topic}. ${question ? `Their question: ${question}` : ''}`;

        return await this.generateResponse(prompt);
    }

    // Generate practice problems
    async generatePracticeProblems(subject, topic, difficulty = 'medium', count = 3) {
        const prompt = `Generate ${count} ${difficulty} difficulty practice problems for ${topic} in ${subject}. 
                       Include the problems and their solutions. Format them clearly for a student to practice with.`;
        
        return await this.generateResponse(prompt);
    }

    // Explain a concept step by step
    async explainConcept(concept, level = 'high school') {
        const prompt = `Explain the concept of "${concept}" at a ${level} level. 
                       Break it down step by step with examples and analogies where helpful. 
                       Make it easy to understand and engaging.`;
        
        return await this.generateResponse(prompt);
    }

    // Review and provide feedback on student work
    async reviewWork(workContent, subject = null) {
        const prompt = `Please review this student work${subject ? ` in ${subject}` : ''}: 
                       
                       ${workContent}
                       
                       Provide constructive feedback, highlight strengths, and suggest improvements. 
                       Be encouraging and educational.`;
        
        return await this.generateResponse(prompt);
    }

    // Reset conversation history
    resetConversation() {
        this.conversationHistory = [];
    }

    // Get conversation history
    getConversationHistory() {
        return [...this.conversationHistory];
    }

    // Check if API key is configured
    isConfigured() {
        return !!this.apiKey && this.apiKey !== 'REPLACE_WITH_YOUR_GEMINI_API_KEY_HERE' && this.apiKey.startsWith('AIzaSy');
    }
}

// Create global instance
window.geminiAI = new GeminiAI();

// Make class available globally
window.GeminiAI = GeminiAI;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiAI;
}