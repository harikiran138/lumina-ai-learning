/**
 * Lumina PostgreSQL Vector Database API Client
 * Connects to PostgreSQL with pgvector extension for semantic search
 */

class LuminaPostgreSQLAPI {
    constructor(config = {}) {
        this.config = {
            host: config.host || 'localhost',
            port: config.port || 5432,
            database: config.database || 'lumina_community',
            username: config.username || 'lumina_user',
            password: config.password || 'lumina_pass',
            apiEndpoint: config.apiEndpoint || '/api',
            ...config
        };
        this.currentUser = null;
        this.isInitialized = false;
        
        // Request throttling
        this.requestQueue = [];
        this.activeRequests = 0;
        this.maxConcurrentRequests = 8;
        this.minRequestInterval = 10; // 10ms between requests (much faster)
        this.lastRequestTime = 0;
        
        // Response caching
        this.cache = new Map();
        this.cacheExpiry = new Map();
        this.defaultCacheTime = 5000; // 5 seconds for faster updates
    }

    async init() {
        if (this.isInitialized) return;
        
        try {
            // Test connection to the API endpoint
            const response = await fetch(`${this.config.apiEndpoint}/health`);
            if (!response.ok) {
                throw new Error(`API endpoint not accessible: ${response.status}`);
            }
            
            console.log('✅ PostgreSQL Vector API initialized successfully');
            this.isInitialized = true;
            
            // Load or create current user
            await this.loadCurrentUser();
            
        } catch (error) {
            console.error('❌ Failed to initialize PostgreSQL API:', error);
            // Fallback to demo mode for development
            console.warn('🔄 Falling back to demo mode...');
            this.isInitialized = true;
            await this.loadCurrentUser();
        }
    }

    async loadCurrentUser() {
        // Try to get from session storage
        const sessionUser = sessionStorage.getItem('currentUser');
        if (sessionUser) {
            this.currentUser = JSON.parse(sessionUser);
            // Always ensure the user exists in database, even for cached users
            await this.ensureUserExists(this.currentUser);
            return this.currentUser;
        }
        
        // Create demo user for development
        this.currentUser = {
            id: `${Math.random().toString(36).substr(2, 9)}`,
            name: 'Demo User',
            email: 'demo@lumina.com',
            role: 'teacher', // Default to teacher for group creation testing
            avatar: 'D',
            color: 'bg-blue-500',
            skills: ['education', 'technology', 'collaboration'],
            bio: 'Demo user for testing Lumina community features'
        };
        
        // Save to session
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Try to create in database with retry logic
        await this.ensureUserExists(this.currentUser);
        
        return this.currentUser;
    }

    async ensureUserExists(userData, maxRetries = 3) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // First try to get the user to see if they exist
                const existingUser = await this.getUser(userData.id);
                if (existingUser) {
                    console.log(`✅ User ${userData.name} already exists in database`);
                    return existingUser;
                }
            } catch (error) {
                // User doesn't exist, continue to creation
            }

            try {
                // Try to create the user
                const createdUser = await this.createUser(userData);
                console.log(`✅ User ${userData.name} created in database`);
                return createdUser;
            } catch (error) {
                console.warn(`Attempt ${attempt}/${maxRetries} failed to create user:`, error.message);
                
                if (attempt === maxRetries) {
                    console.error('❌ Failed to create user after all retries. User may not exist in database.');
                    // Still return the user object so the app can function, but warn about potential issues
                    return userData;
                }
                
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
        }
    }

    async getUser(userId) {
        return this.apiRequest(`/users/${userId}`);
    }

    // Clear user session and force re-initialization
    clearUserSession() {
        sessionStorage.removeItem('currentUser');
        this.currentUser = null;
        this.isInitialized = false;
    }

    // API Helper methods with caching and throttling
    async apiRequest(endpoint, options = {}) {
        // For ultra-fast performance, use direct requests for all operations
        return this.fastApiRequest(endpoint, options);
    }

    getFromCache(key) {
        const expiry = this.cacheExpiry.get(key);
        if (expiry && Date.now() > expiry) {
            this.cache.delete(key);
            this.cacheExpiry.delete(key);
            return null;
        }
        return this.cache.get(key);
    }

    setCache(key, value, ttl = this.defaultCacheTime) {
        this.cache.set(key, value);
        this.cacheExpiry.set(key, Date.now() + ttl);
    }

    async processRequestQueue() {
        if (this.activeRequests >= this.maxConcurrentRequests || this.requestQueue.length === 0) {
            return;
        }

        const now = Date.now();
        if (now - this.lastRequestTime < this.minRequestInterval) {
            setTimeout(() => this.processRequestQueue(), this.minRequestInterval - (now - this.lastRequestTime));
            return;
        }

        const { endpoint, options, resolve, reject } = this.requestQueue.shift();
        this.activeRequests++;
        this.lastRequestTime = now;

        try {
            const result = await this.makeRequest(endpoint, options);
            
            // Cache GET requests
            if (!options.method || options.method === 'GET') {
                const cacheKey = `${endpoint}${JSON.stringify(options)}`;
                this.setCache(cacheKey, result);
            }
            
            resolve(result);
        } catch (error) {
            reject(error);
        } finally {
            this.activeRequests--;
            // Process next request in queue
            setTimeout(() => this.processRequestQueue(), this.minRequestInterval);
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.config.apiEndpoint}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error ${response.status}: ${errorText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error(`API Request failed for ${endpoint}:`, error);
            
            // Return mock data for development when API is not available
            return this.getMockData(endpoint, options);
        }
    }

    // Mock data for development/testing
    getMockData(endpoint, options) {
        console.warn(`🎭 Using mock data for: ${endpoint}`);
        
        const mockUsers = [
            {
                id: 'admin_001', name: 'Admin User', email: 'admin@lumina.com', 
                role: 'admin', avatar: 'A', color: 'bg-red-500',
                skills: ['leadership', 'management', 'education']
            },
            {
                id: 'teacher_001', name: 'Dr. Sarah Wilson', email: 'sarah@lumina.com',
                role: 'teacher', avatar: 'S', color: 'bg-indigo-500',
                skills: ['physics', 'mathematics', 'research', 'teaching']
            },
            {
                id: 'student_001', name: 'Alex Turner', email: 'alex@student.lumina.com',
                role: 'student', avatar: 'A', color: 'bg-amber-500',
                skills: ['programming', 'mathematics', 'physics']
            }
        ];

        const mockGroups = [
            {
                id: 'general', name: 'General Discussion',
                description: 'Welcome to Lumina! Chat with students and teachers from all subjects.',
                type: 'general', avatar: '💬', color: 'bg-blue-500',
                created_by: 'admin_001', member_count: 5, message_count: 12,
                created_at: new Date().toISOString()
            },
            {
                id: 'study_buddies', name: 'Study Buddies',
                description: 'Find study partners and form study groups!',
                type: 'study-group', avatar: '📚', color: 'bg-green-500',
                created_by: 'admin_001', member_count: 3, message_count: 8,
                created_at: new Date().toISOString()
            }
        ];

        const mockMessages = [
            {
                id: 1, group_id: 'general', user_id: 'admin_001',
                content: 'Welcome to Lumina Community! 🎉',
                sender_name: 'Admin User', sender_avatar: 'A', sender_color: 'bg-red-500',
                created_at: new Date().toISOString()
            },
            {
                id: 2, group_id: 'general', user_id: 'student_001',
                content: 'Hi everyone! Excited to be here! 📚',
                sender_name: 'Alex Turner', sender_avatar: 'A', sender_color: 'bg-amber-500',
                created_at: new Date().toISOString()
            }
        ];

        if (endpoint === '/users') return mockUsers;
        if (endpoint === '/groups') return mockGroups;
        if (endpoint.includes('/messages')) return mockMessages;
        if (endpoint.includes('/groups') && options.method === 'POST') {
            const newGroup = {
                id: `group_${Date.now()}`,
                ...options.body,
                created_by: this.currentUser?.id || 'demo_user',
                created_at: new Date().toISOString(),
                member_count: 1,
                message_count: 0
            };
            return newGroup;
        }
        
        return [];
    }

    // User Management
    async getCurrentUser() {
        if (!this.currentUser) {
            await this.loadCurrentUser();
        }
        return this.currentUser;
    }

    async getAllUsers() {
        return this.apiRequest('/users');
    }

    async createUser(userData) {
        const user = {
            id: userData.id || `user_${Date.now()}`,
            name: userData.name,
            email: userData.email,
            role: userData.role || 'student',
            avatar: userData.avatar || userData.name.charAt(0).toUpperCase(),
            color: userData.color || this.generateColor(userData.name),
            skills: userData.skills || [],
            bio: userData.bio || '',
            created_at: new Date().toISOString()
        };

        return this.apiRequest('/users', {
            method: 'POST',
            body: user
        });
    }

    async findSimilarUsers(userId, limit = 5) {
        return this.apiRequest(`/users/${userId}/similar?limit=${limit}`);
    }

    // Group Management
    async getAllGroups() {
        return this.apiRequest('/groups');
    }

    async createGroup(groupData) {
        const currentUser = await this.getCurrentUser();
        const group = {
            id: groupData.id || `group_${Date.now()}`,
            name: groupData.name,
            description: groupData.description || '',
            type: groupData.type || 'study-group',
            avatar: groupData.avatar || '📚',
            color: groupData.color || 'bg-green-500',
            created_by: currentUser.id,
            is_private: groupData.is_private || false,
            max_members: groupData.max_members || 50
        };

        const createdGroup = await this.apiRequest('/groups', {
            method: 'POST',
            body: group
        });

        // Add creator as member
        await this.joinGroup(createdGroup.id || group.id);

        return createdGroup;
    }

    async joinGroup(groupId) {
        const currentUser = await this.getCurrentUser();
        return this.apiRequest(`/groups/${groupId}/members`, {
            method: 'POST',
            body: { user_id: currentUser.id }
        });
    }

    async addGroupMember(groupId, userId) {
        return this.apiRequest(`/groups/${groupId}/members`, {
            method: 'POST',
            body: { user_id: userId }
        });
    }

    async getGroupMembers(groupId) {
        return this.apiRequest(`/groups/${groupId}/members`);
    }

    async recommendGroups(userId, limit = 5) {
        return this.apiRequest(`/users/${userId}/recommended-groups?limit=${limit}`);
    }

    // Message Management
    async getGroupMessages(groupId, limit = 50) {
        // Use fast path for message retrieval
        const messages = await this.fastApiRequest(`/groups/${groupId}/messages?limit=${limit}`);
        
        // Format messages for the UI
        return messages.map(msg => ({
            ...msg,
            sender: msg.sender_name,
            senderAvatar: msg.sender_avatar,
            senderColor: msg.sender_color,
            senderRole: msg.sender_role,
            time: new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }));
    }

    async sendMessage(groupId, content) {
        const currentUser = await this.getCurrentUser();
        const message = {
            group_id: groupId,
            user_id: currentUser.id,
            content: content,
            type: 'text'
        };

        // Use direct fetch for critical operations like sending messages
        return this.fastApiRequest('/messages', {
            method: 'POST',
            body: message
        });
    }

    // Fast path for critical operations with rate limit handling
    async fastApiRequest(endpoint, options = {}, retryCount = 0) {
        const url = `${this.config.apiEndpoint}${endpoint}`;
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        
        const fetchOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options.headers
            },
            ...options
        };

        if (options.body) {
            fetchOptions.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(url, fetchOptions);
            
            // Handle rate limiting with exponential backoff
            if (response.status === 429 && retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.fastApiRequest(endpoint, options, retryCount + 1);
            }
            
            if (!response.ok) {
                if (response.status === 429) {
                    // If still rate limited after retries, fail silently for non-critical operations
                    if (options.method === 'GET') {
                        return [];
                    }
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // Silent fail for rate limit errors on GET requests
            if (error.message.includes('429') && options.method === 'GET') {
                return [];
            }
            console.error('Fast API request failed:', error);
            throw error;
        }
    }

    async searchMessages(query, groupId = null, limit = 20) {
        const params = new URLSearchParams({
            q: query,
            limit: limit.toString()
        });
        
        if (groupId) {
            params.append('group_id', groupId);
        }

        const results = await this.apiRequest(`/messages/search?${params}`);
        
        // Format for UI
        return results.map(msg => ({
            ...msg,
            sender: msg.sender_name,
            senderAvatar: msg.sender_avatar,
            senderColor: msg.sender_color,
            time: new Date(msg.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            })
        }));
    }

    // Analytics and Recommendations
    async getRecommendations(userId) {
        const [similarUsers, recommendedGroups] = await Promise.all([
            this.findSimilarUsers(userId, 3),
            this.recommendGroups(userId, 5)
        ]);
        
        return {
            similarUsers: similarUsers.filter(u => u.user_id !== userId),
            recommendedGroups: recommendedGroups.filter(g => 
                !g.members || !g.members.includes(userId)
            )
        };
    }

    async getGroupAnalytics(groupId) {
        return this.apiRequest(`/groups/${groupId}/analytics`);
    }

    // Utility methods
    generateColor(text) {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
        ];
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = text.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.apiRequest('/health');
            return { status: 'healthy', ...result };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }
}

// Global instance
window.luminaPostgreSQLAPI = new LuminaPostgreSQLAPI();
window.postgresAPI = window.luminaPostgreSQLAPI; // Alias for easier access

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LuminaPostgreSQLAPI;
}