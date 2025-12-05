/**
 * Lumina Messaging System
 * Handles user-to-user and room-based messaging
 */

class MessagingSystem {
    constructor() {
        this.currentUserId = null;
        this.listeners = {
            messageReceived: [],
            roomUpdated: [],
            userTyping: []
        };
    }

    async init() {
        const currentUser = await window.luminaDB.getCurrentUser();
        if (currentUser) {
            this.currentUserId = currentUser.id;
        }
    }

    /**
     * Send a direct message
     */
    async sendDirectMessage(recipientId, text) {
        if (!this.currentUserId) throw new Error('User not logged in');
        
        const message = {
            id: `msg_${Date.now()}`,
            senderId: this.currentUserId,
            recipientId: recipientId,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'direct',
            read: false
        };

        // Save to database
        await window.luminaDB.add('messages', message);
        this.notifyListeners('messageReceived', message);
        return message;
    }

    /**
     * Send room message
     */
    async sendRoomMessage(roomId, text) {
        if (!this.currentUserId) throw new Error('User not logged in');
        
        const message = {
            roomId: roomId,
            senderId: this.currentUserId,
            text: text,
            timestamp: new Date().toISOString(),
            type: 'text'
        };

        await window.luminaDB.addChatMessage(roomId, this.currentUserId, text);
        this.notifyListeners('messageReceived', message);
        return message;
    }

    /**
     * Get messages for a room
     */
    async getRoomMessages(roomId, limit = 50) {
        const messages = await window.luminaDB.getChatMessages(roomId);
        return messages
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-limit);
    }

    /**
     * Get direct messages with a user
     */
    async getDirectMessages(userId, limit = 50) {
        const messages = await window.luminaDB.getByIndex('messages', 'senderId', this.currentUserId);
        const received = await window.luminaDB.getByIndex('messages', 'senderId', userId);
        
        const filtered = [...messages, ...received]
            .filter(m => m.type === 'direct' && 
                    ((m.senderId === this.currentUserId && m.recipientId === userId) ||
                     (m.senderId === userId && m.recipientId === this.currentUserId)))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .slice(-limit);
        
        return filtered;
    }

    /**
     * Mark message as read
     */
    async markAsRead(messageId) {
        const message = await window.luminaDB.get('messages', messageId);
        if (message) {
            message.read = true;
            await window.luminaDB.put('messages', message);
        }
    }

    /**
     * Delete message
     */
    async deleteMessage(messageId) {
        await window.luminaDB.delete('messages', messageId);
        this.notifyListeners('messageReceived', { deleted: true, id: messageId });
    }

    /**
     * Edit message
     */
    async editMessage(messageId, newText) {
        const message = await window.luminaDB.get('messages', messageId);
        if (message) {
            message.text = newText;
            message.edited = true;
            message.editedAt = new Date().toISOString();
            await window.luminaDB.put('messages', message);
            return message;
        }
        throw new Error('Message not found');
    }

    /**
     * Add reaction to message
     */
    async addReaction(messageId, emoji) {
        const message = await window.luminaDB.get('messages', messageId);
        if (message) {
            if (!message.reactions) message.reactions = {};
            if (!message.reactions[emoji]) {
                message.reactions[emoji] = [];
            }
            if (!message.reactions[emoji].includes(this.currentUserId)) {
                message.reactions[emoji].push(this.currentUserId);
            }
            await window.luminaDB.put('messages', message);
            return message;
        }
    }

    /**
     * Get unread message count
     */
    async getUnreadCount() {
        const messages = await window.luminaDB.getAll('messages');
        return messages.filter(m => 
            m.recipientId === this.currentUserId && 
            !m.read &&
            m.type === 'direct'
        ).length;
    }

    /**
     * Subscribe to events
     */
    subscribe(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Global instance
window.messagingSystem = new MessagingSystem();
