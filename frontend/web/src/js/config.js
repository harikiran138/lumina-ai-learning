/**
 * Lumina AI Configuration
 * Replace the API key below with your actual Gemini API key
 */

window.LuminaConfig = {
    // Gemini API Configuration
    gemini: {
        // Get your free API key from: https://aistudio.google.com/app/apikey
        apiKey: 'AIzaSyAJ60XQx9GlorX46Y17SrKlxhDnLvH46Wo', // Replace this with your real API key

        // Optional: Model configuration
        model: 'gemini-2.0-flash',

        // Optional: Generation settings
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
            topP: 0.8,
            topK: 40
        }
    },

    // AI Tutor Settings
    aiTutor: {
        maxHistoryLength: 10,
        typingDelay: 1000, // ms delay for typing indicator
        enableQuickActions: true
    },

    // Educational Context
    education: {
        studentLevel: 'high school', // or 'middle school', 'college', etc.
        subjects: ['math', 'science', 'history', 'literature', 'language'],
        language: 'english'
    }
};

// Apply configuration on load
document.addEventListener('DOMContentLoaded', () => {
    if (window.geminiAI && window.LuminaConfig.gemini.apiKey !== 'REPLACE_WITH_YOUR_GEMINI_API_KEY_HERE') {
        window.geminiAI.setApiKey(window.LuminaConfig.gemini.apiKey);
        console.log('✅ Lumina AI configured with backend API key');
    } else {
        console.log('⚠️ Please replace the API key in config.js with your actual Gemini API key');
    }
});