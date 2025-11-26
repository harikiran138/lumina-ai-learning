/**
 * Lumina Notifications System
 * Handles in-app notifications and alerts
 */

class NotificationsManager {
    constructor() {
        this.notifications = [];
        this.listeners = [];
        this.nextId = 1;
    }

    /**
     * Add notification
     */
    addNotification(notification) {
        const id = this.nextId++;
        const notif = {
            id,
            type: notification.type || 'info', // info, success, warning, error
            title: notification.title,
            message: notification.message,
            timestamp: new Date().toISOString(),
            read: false,
            action: notification.action || null,
            actionLabel: notification.actionLabel || null,
            duration: notification.duration || 5000 // auto-dismiss in 5 seconds
        };

        this.notifications.unshift(notif);
        this.notifyListeners(notif);

        // Auto-remove after duration
        if (notif.duration) {
            setTimeout(() => {
                this.removeNotification(id);
            }, notif.duration);
        }

        return notif;
    }

    /**
     * Remove notification
     */
    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
    }

    /**
     * Get all notifications
     */
    getNotifications() {
        return this.notifications;
    }

    /**
     * Get unread notifications
     */
    getUnreadNotifications() {
        return this.notifications.filter(n => !n.read);
    }

    /**
     * Mark notification as read
     */
    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
            notif.read = true;
        }
    }

    /**
     * Mark all as read
     */
    markAllAsRead() {
        this.notifications.forEach(n => {
            n.read = true;
        });
    }

    /**
     * Clear all notifications
     */
    clearAll() {
        this.notifications = [];
    }

    /**
     * Subscribe to notifications
     */
    subscribe(callback) {
        this.listeners.push(callback);
    }

    /**
     * Unsubscribe from notifications
     */
    unsubscribe(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    /**
     * Notify listeners
     */
    notifyListeners(notification) {
        this.listeners.forEach(callback => callback(notification));
    }

    /**
     * Success notification
     */
    success(title, message, options = {}) {
        return this.addNotification({
            ...options,
            type: 'success',
            title,
            message
        });
    }

    /**
     * Error notification
     */
    error(title, message, options = {}) {
        return this.addNotification({
            ...options,
            type: 'error',
            title,
            message,
            duration: 7000
        });
    }

    /**
     * Warning notification
     */
    warning(title, message, options = {}) {
        return this.addNotification({
            ...options,
            type: 'warning',
            title,
            message,
            duration: 6000
        });
    }

    /**
     * Info notification
     */
    info(title, message, options = {}) {
        return this.addNotification({
            ...options,
            type: 'info',
            title,
            message
        });
    }
}

// Global instance
window.notificationsManager = new NotificationsManager();
