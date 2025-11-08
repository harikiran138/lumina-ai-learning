// Analytics API for Lumina LMS
// Handles API calls to backend analytics endpoints

class AnalyticsAPI {
    constructor() {
        this.baseURL = 'http://localhost:8000/api';
        this.token = localStorage.getItem('authToken');
    }

    // Helper method to make authenticated API calls
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`API request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    // Get class analytics for a specific course
    async getClassAnalytics(courseId) {
        return await this.makeRequest(`/class-analytics/${courseId}`);
    }

    // Get detailed analytics for a specific student
    async getStudentAnalytics(studentId) {
        return await this.makeRequest(`/student-analytics/${studentId}`);
    }

    // Get weakness detection analysis for a course
    async getWeaknessDetection(courseId) {
        return await this.makeRequest(`/weakness-detection/${courseId}`);
    }

    // Get attendance reports for a course
    async getAttendanceReports(courseId) {
        return await this.makeRequest(`/attendance-reports/${courseId}`);
    }

    // Get streak information for a student
    async getStreakInfo(studentId) {
        return await this.makeRequest(`/streak/${studentId}`);
    }

    // Record activity for streak tracking
    async recordActivity(studentId, activityType) {
        return await this.makeRequest('/record-activity', {
            method: 'POST',
            body: JSON.stringify({
                student_id: studentId,
                activity_type: activityType
            })
        });
    }

    // Get progress history for a course (for line chart)
    async getProgressHistory(courseId, timeframe = 'monthly') {
        return await this.makeRequest(`/progress-history/${courseId}?timeframe=${timeframe}`);
    }

    // Get assessment scores for a course (for bar chart)
    async getAssessmentScores(courseId) {
        return await this.makeRequest(`/assessment-scores/${courseId}`);
    }

    // Get detailed progress data for a specific student
    async getStudentProgressHistory(studentId, courseId) {
        return await this.makeRequest(`/student-progress-history/${studentId}/${courseId}`);
    }
}

// Create global instance
const analyticsAPI = new AnalyticsAPI();
