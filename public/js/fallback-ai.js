/**
 * Fallback AI Service - Simple pattern-based responses for testing
 */

class FallbackAI {
    constructor() {
        this.responses = {
            greetings: [
                "Hello! I'm here to help you learn. What would you like to know?",
                "Hi there! What subject can I help you with today?",
                "Welcome! I'm ready to answer your questions."
            ],
            
            math: [
                "Mathematics is fascinating! It's the language of patterns and logic. What specific math topic interests you?",
                "Math helps us understand the world around us. From basic arithmetic to advanced calculus, I'm here to help!",
                "Great question about math! Let me break this down step by step for you."
            ],
            
            science: [
                "Science is all about discovery and understanding how things work! What area of science are you curious about?",
                "The scientific method helps us learn about our universe. What would you like to explore?",
                "Science connects everything - from tiny atoms to massive galaxies. What interests you most?"
            ],
            
            general: [
                "That's an interesting question! Let me think about the best way to explain this concept.",
                "Great question! Understanding this topic will help build your knowledge foundation.",
                "I love curious minds! Let's explore this topic together.",
                "That's a thoughtful question. Here's how I'd approach explaining this concept..."
            ],
            
            encouragement: [
                "You're asking great questions - that's how we learn!",
                "Keep up the curiosity! Learning is a journey, and you're on the right path.",
                "Don't worry if this seems challenging at first - that's normal when learning something new!"
            ]
        };
    }

    async generateResponse(userMessage) {
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
        
        const message = userMessage.toLowerCase();
        
        // Pattern matching for different types of questions
        if (this.containsWords(message, ['hello', 'hi', 'hey', 'greetings'])) {
            return this.getRandomResponse('greetings');
        }
        
        if (this.containsWords(message, ['math', 'algebra', 'calculus', 'geometry', 'arithmetic', 'equation'])) {
            return this.getMathResponse(message);
        }
        
        if (this.containsWords(message, ['science', 'physics', 'chemistry', 'biology', 'experiment'])) {
            return this.getScienceResponse(message);
        }
        
        if (this.containsWords(message, ['what is', 'explain', 'define', 'meaning'])) {
            return this.getDefinitionResponse(message);
        }
        
        if (this.containsWords(message, ['help', 'confused', 'don\'t understand', 'difficult'])) {
            return this.getRandomResponse('encouragement') + "\n\n" + this.getRandomResponse('general');
        }
        
        // Default educational response
        return this.getRandomResponse('general') + "\n\nCould you be more specific about what you'd like to learn? I can help with math, science, history, literature, and many other subjects!";
    }

    containsWords(text, words) {
        return words.some(word => text.includes(word));
    }

    getRandomResponse(category) {
        const responses = this.responses[category];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getMathResponse(message) {
        const responses = [
            "Mathematics is built on logical thinking and problem-solving. " + this.getRandomResponse('math'),
            "Let's approach this math problem step by step. " + this.getRandomResponse('general'),
            "Math can seem challenging, but breaking it down makes it easier. " + this.getRandomResponse('encouragement')
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getScienceResponse(message) {
        const responses = [
            "Science is about observation, hypothesis, and discovery! " + this.getRandomResponse('science'),
            "The scientific method helps us understand natural phenomena. " + this.getRandomResponse('general'),
            "Science connects to everything in our daily lives. " + this.getRandomResponse('encouragement')
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getDefinitionResponse(message) {
        return "That's a great question about definitions and concepts! Understanding the meaning of terms is crucial for learning. " + this.getRandomResponse('general');
    }

    isConfigured() {
        return true; // Always available
    }

    testConnection() {
        return { success: true, response: "Fallback AI is working perfectly!" };
    }
}

// Make available globally
window.FallbackAI = FallbackAI;