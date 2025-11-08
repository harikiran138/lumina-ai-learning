// Student Dashboard Real-time Controller
import { realtimeLearning } from '../js/realtime-learning.js';

class StudentDashboardController {
    constructor() {
        this.currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        this.masteryChart = null;
        this.initializeDashboard();
    }

    async initializeDashboard() {
        try {
            // Initialize WebSocket connection
            await realtimeLearning.connectAsStudent(this.currentUser.id);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('Dashboard initialization error:', error);
            this.showError('Failed to initialize dashboard. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Listen for pathway updates
        realtimeLearning.addEventListener('pathwayUpdate', (data) => {
            this.updatePathwaySection(data);
        });

        // Listen for progress updates
        realtimeLearning.addEventListener('progressUpdate', (data) => {
            this.updateProgressStats(data);
        });

        // Listen for analytics updates
        realtimeLearning.addEventListener('analyticsUpdate', (data) => {
            this.updateAnalytics(data);
        });

        // Listen for WebSocket errors
        realtimeLearning.addEventListener('error', (error) => {
            this.showError('Connection lost. Attempting to reconnect...');
        });
    }

    async loadDashboardData() {
        try {
            // Fetch current pathway
            const response = await fetch(`/api/student/pathway/${this.currentUser.id}`);
            const data = await response.json();
            
            // Update UI with initial data
            this.updatePathwaySection(data.pathway);
            this.updateProgressStats(data.progress);
            this.initializeMasteryChart(data.mastery);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showError('Failed to load dashboard data.');
        }
    }

    updatePathwaySection(pathway) {
        const pathwayContainer = document.querySelector('#learning-pathway');
        if (!pathwayContainer) return;

        // Clear existing content
        pathwayContainer.innerHTML = '';

        // Add pathway steps
        pathway.forEach((step, index) => {
            const stepElement = this.createPathwayStep(step, index);
            pathwayContainer.appendChild(stepElement);
        });
    }

    createPathwayStep(step, index) {
        const div = document.createElement('div');
        div.className = 'flex items-start space-x-4';
        
        const status = this.getStepStatus(step);
        const isLocked = status === 'locked';
        
        div.innerHTML = `
            <div class="flex-shrink-0 w-12 h-12 rounded-full ${this.getStatusStyles(status)} flex items-center justify-center">
                ${this.getStatusIcon(status)}
            </div>
            <div class="flex-1">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    ${step.type}: ${status}
                </p>
                <h4 class="font-semibold text-gray-800 dark:text-white">
                    ${step.title}
                </h4>
                ${this.getProgressBar(step)}
            </div>
            ${this.getActionButton(step, status)}
        `;

        if (isLocked) {
            div.classList.add('opacity-40');
        }

        return div;
    }

    getStepStatus(step) {
        if (step.locked) return 'locked';
        if (step.completed) return 'completed';
        if (step.in_progress) return 'in_progress';
        return 'not_started';
    }

    getStatusStyles(status) {
        const styles = {
            completed: 'bg-green-100 dark:bg-green-500/10',
            in_progress: 'bg-amber-100 dark:bg-amber-500/10',
            not_started: 'bg-gray-100 dark:bg-gray-800',
            locked: 'bg-gray-100 dark:bg-gray-800'
        };
        return styles[status] || styles.not_started;
    }

    getStatusIcon(status) {
        const icons = {
            completed: `<svg class="w-6 h-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>`,
            in_progress: `<svg class="w-6 h-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>`,
            locked: `<svg class="w-6 h-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>`,
            not_started: `<svg class="w-6 h-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>`
        };
        return icons[status] || icons.not_started;
    }

    getProgressBar(step) {
        if (!step.progress && step.progress !== 0) return '';
        
        return `
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                <div class="bg-amber-500 h-2.5 rounded-full" style="width: ${step.progress}%"></div>
            </div>
        `;
    }

    getActionButton(step, status) {
        if (status === 'locked') return '';
        
        const buttonStyles = {
            completed: 'text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:text-green-300 dark:hover:bg-green-500/30',
            in_progress: 'text-white bg-amber-600 hover:bg-amber-700',
            not_started: 'text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30'
        };

        const buttonText = {
            completed: 'Review',
            in_progress: 'Continue',
            not_started: 'Start'
        };

        return `
            <a href="${step.url || '#'}" 
               class="self-center px-4 py-2 text-sm font-medium rounded-lg transition ${buttonStyles[status]}">
                ${buttonText[status]}
            </a>
        `;
    }

    updateProgressStats(progress) {
        // Update mastery percentage
        const masteryElement = document.querySelector('#mastery-percentage');
        if (masteryElement) {
            masteryElement.textContent = `${progress.overall_mastery}%`;
        }

        // Update learning streak
        const streakElement = document.querySelector('#learning-streak');
        if (streakElement) {
            streakElement.textContent = `${progress.current_streak} days`;
        }

        // Update attendance
        const attendanceElement = document.querySelector('#attendance-percentage');
        if (attendanceElement) {
            attendanceElement.textContent = `${progress.attendance_rate}%`;
        }
    }

    initializeMasteryChart(masteryData) {
        const ctx = document.getElementById('masteryChart').getContext('2d');
        const isDarkMode = document.documentElement.classList.contains('dark');

        const gradient = ctx.createLinearGradient(0, 0, 0, 200);
        gradient.addColorStop(0, isDarkMode ? 'rgba(251, 191, 36, 0.4)' : 'rgba(252, 211, 77, 0.6)');
        gradient.addColorStop(1, isDarkMode ? 'rgba(251, 191, 36, 0.05)' : 'rgba(252, 211, 77, 0.05)');

        this.masteryChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: masteryData.topics,
                datasets: [{
                    label: 'Mastery',
                    data: masteryData.scores,
                    backgroundColor: gradient,
                    borderColor: '#fbbf24',
                    pointBackgroundColor: '#fbbf24',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#fbbf24',
                    borderWidth: 2
                }]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
                        grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)' },
                        pointLabels: { 
                            color: isDarkMode ? '#d1d5db' : '#4b5563',
                            font: { size: 12 }
                        },
                        ticks: {
                            color: isDarkMode ? '#9ca3af' : '#6b7280',
                            backdropColor: 'transparent',
                            stepSize: 25
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }

    updateAnalytics(data) {
        // Update AI Tutor section
        const aiTutorSection = document.querySelector('#ai-tutor-section');
        if (aiTutorSection) {
            this.updateAITutorSection(data.ai_analysis);
        }

        // Update mastery chart if available
        if (data.mastery && this.masteryChart) {
            this.masteryChart.data.datasets[0].data = data.mastery.scores;
            this.masteryChart.update();
        }
    }

    updateAITutorSection(analysis) {
        const weakAreasContainer = document.querySelector('#weak-areas');
        if (!weakAreasContainer) return;

        weakAreasContainer.innerHTML = analysis.weak_areas.map(area => `
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <div>
                    <p class="font-medium text-sm text-gray-800 dark:text-gray-200">
                        Weak Area: ${area.topic}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        ${area.description}
                    </p>
                </div>
                <a href="${area.review_url}" 
                   class="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-full hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:hover:bg-amber-500/30">
                    Review Lesson
                </a>
            </div>
        `).join('');
    }

    showError(message) {
        // Implement error notification
        console.error(message);
        // You could add a toast notification here
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new StudentDashboardController();
});