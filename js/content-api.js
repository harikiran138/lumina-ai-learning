/**
 * Content API client for RAG functionality
 * Handles file uploads and content queries
 */

class ContentAPI {
    constructor(baseURL = '/api') {
        this.baseURL = baseURL;
    }

    /**
     * Upload a file for RAG processing
     * @param {File} file - The file to upload
     * @param {Object} options - Upload options
     * @param {string} options.courseId - Optional course ID
     * @param {string} options.title - Optional title
     * @param {string} options.description - Optional description
     * @returns {Promise<Object>} Upload result
     */
    async uploadFile(file, options = {}) {
        const formData = new FormData();
        formData.append('file', file);

        if (options.courseId) formData.append('course_id', options.courseId);
        if (options.title) formData.append('title', options.title);
        if (options.description) formData.append('description', options.description);

        try {
            const response = await fetch(`${this.baseURL}/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    /**
     * Query the RAG system
     * @param {string} query - The query text
     * @param {Object} options - Query options
     * @param {string} options.courseId - Optional course ID to filter by
     * @param {number} options.limit - Maximum number of results (default: 5)
     * @returns {Promise<Object>} Query result with answer and sources
     */
    async queryContent(query, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    query: query,
                    course_id: options.courseId,
                    limit: options.limit || 5
                })
            });

            if (!response.ok) {
                throw new Error(`Query failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Query error:', error);
            throw error;
        }
    }

    /**
     * Get authentication token from localStorage or session
     * @returns {string|null} Auth token
     */
    getAuthToken() {
        // Try different storage locations
        return localStorage.getItem('authToken') ||
               sessionStorage.getItem('authToken') ||
               null;
    }

    /**
     * Set authentication token
     * @param {string} token - Auth token
     */
    setAuthToken(token) {
        localStorage.setItem('authToken', token);
    }

    /**
     * Clear authentication token
     */
    clearAuthToken() {
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('authToken');
    }
}

// Create global instance
const contentAPI = new ContentAPI();

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContentAPI;
}
