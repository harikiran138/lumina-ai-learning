/**
 * Real-time learning pathway WebSocket client
 * Handles WebSocket connections for real-time updates in student and teacher interfaces
 */

class RealtimeLearningClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || window.location.origin.replace('http', 'ws');
        this.studentSocket = null;
        this.teacherSocket = null;
        this.analyticsSocket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.listeners = {
            pathwayUpdate: new Set(),
            progressUpdate: new Set(),
            analyticsUpdate: new Set(),
            error: new Set()
        };
    }

    // Student connection methods
    async connectAsStudent(studentId) {
        try {
            this.studentSocket = new WebSocket(`${this.baseUrl}/ws/student/${studentId}`);
            this.setupStudentSocketHandlers();
            return true;
        } catch (error) {
            console.error('Student WebSocket connection failed:', error);
            this.notifyListeners('error', error);
            return false;
        }
    }

    // Teacher connection methods
    async connectAsTeacher(teacherId) {
        try {
            this.teacherSocket = new WebSocket(`${this.baseUrl}/ws/teacher/${teacherId}`);
            this.setupTeacherSocketHandlers();
            return true;
        } catch (error) {
            console.error('Teacher WebSocket connection failed:', error);
            this.notifyListeners('error', error);
            return false;
        }
    }

    // Analytics connection methods
    async connectToAnalytics() {
        try {
            this.analyticsSocket = new WebSocket(`${this.baseUrl}/ws/analytics`);
            this.setupAnalyticsSocketHandlers();
            return true;
        } catch (error) {
            console.error('Analytics WebSocket connection failed:', error);
            this.notifyListeners('error', error);
            return false;
        }
    }

    // Socket event handlers
    setupStudentSocketHandlers() {
        this.studentSocket.onopen = () => {
            console.log('Student WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.studentSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'pathway_update':
                        this.notifyListeners('pathwayUpdate', data.data);
                        break;
                    case 'progress_update':
                        this.notifyListeners('progressUpdate', data.data);
                        break;
                    default:
                        console.warn('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        this.studentSocket.onclose = () => {
            console.log('Student WebSocket disconnected');
            this.handleReconnection('student');
        };

        this.studentSocket.onerror = (error) => {
            console.error('Student WebSocket error:', error);
            this.notifyListeners('error', error);
        };
    }

    setupTeacherSocketHandlers() {
        this.teacherSocket.onopen = () => {
            console.log('Teacher WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.teacherSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'student_progress':
                        this.notifyListeners('progressUpdate', data.data);
                        break;
                    case 'analytics_update':
                        this.notifyListeners('analyticsUpdate', data.data);
                        break;
                    default:
                        console.warn('Unknown message type:', data.type);
                }
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };

        this.teacherSocket.onclose = () => {
            console.log('Teacher WebSocket disconnected');
            this.handleReconnection('teacher');
        };

        this.teacherSocket.onerror = (error) => {
            console.error('Teacher WebSocket error:', error);
            this.notifyListeners('error', error);
        };
    }

    setupAnalyticsSocketHandlers() {
        this.analyticsSocket.onopen = () => {
            console.log('Analytics WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.analyticsSocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'analytics_update') {
                    this.notifyListeners('analyticsUpdate', data.data);
                }
            } catch (error) {
                console.error('Error processing analytics message:', error);
            }
        };

        this.analyticsSocket.onclose = () => {
            console.log('Analytics WebSocket disconnected');
            this.handleReconnection('analytics');
        };

        this.analyticsSocket.onerror = (error) => {
            console.error('Analytics WebSocket error:', error);
            this.notifyListeners('error', error);
        };
    }

    // Message sending methods
    async sendProgressUpdate(progressData) {
        if (!this.studentSocket || this.studentSocket.readyState !== WebSocket.OPEN) {
            throw new Error('Student WebSocket not connected');
        }

        this.studentSocket.send(JSON.stringify({
            type: 'progress_update',
            data: progressData
        }));
    }

    async requestAnalytics(courseId) {
        if (!this.teacherSocket || this.teacherSocket.readyState !== WebSocket.OPEN) {
            throw new Error('Teacher WebSocket not connected');
        }

        this.teacherSocket.send(JSON.stringify({
            type: 'analytics_request',
            course_id: courseId
        }));
    }

    // Event listener methods
    addEventListener(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].add(callback);
        }
    }

    removeEventListener(eventType, callback) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].delete(callback);
        }
    }

    notifyListeners(eventType, data) {
        if (this.listeners[eventType]) {
            this.listeners[eventType].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${eventType} listener:`, error);
                }
            });
        }
    }

    // Reconnection logic
    async handleReconnection(socketType) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error(`Max reconnection attempts reached for ${socketType} socket`);
            this.notifyListeners('error', new Error('Connection lost'));
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

        console.log(`Attempting to reconnect ${socketType} socket in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));

        switch (socketType) {
            case 'student':
                if (this.studentSocket) {
                    const studentId = this.studentSocket.url.split('/').pop();
                    await this.connectAsStudent(studentId);
                }
                break;
            case 'teacher':
                if (this.teacherSocket) {
                    const teacherId = this.teacherSocket.url.split('/').pop();
                    await this.connectAsTeacher(teacherId);
                }
                break;
            case 'analytics':
                await this.connectToAnalytics();
                break;
        }
    }

    // Cleanup
    disconnect() {
        if (this.studentSocket) {
            this.studentSocket.close();
            this.studentSocket = null;
        }
        if (this.teacherSocket) {
            this.teacherSocket.close();
            this.teacherSocket = null;
        }
        if (this.analyticsSocket) {
            this.analyticsSocket.close();
            this.analyticsSocket = null;
        }
    }
}

// Export for use in other modules
export const realtimeLearning = new RealtimeLearningClient();