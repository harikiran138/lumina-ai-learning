/**
 * Real-time analytics client for student dashboard
 */

class AnalyticsClient {
    constructor(studentId) {
        this.studentId = studentId;
        this.socket = null;
        this.callbacks = {
            onAnalyticsUpdate: [],
            onPathwayUpdate: [],
            onError: []
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second delay
    }

    /**
     * Connect to the analytics WebSocket server
     */
    connect() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws/student/${this.studentId}`;
            
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('Analytics WebSocket connected');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
            };
            
            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                    this.notifyError(err);
                }
            };
            
            this.socket.onclose = () => {
                console.log('Analytics WebSocket disconnected');
                this.attemptReconnect();
            };
            
            this.socket.onerror = (error) => {
                console.error('Analytics WebSocket error:', error);
                this.notifyError(error);
            };
        } catch (err) {
            console.error('Error connecting to WebSocket:', err);
            this.notifyError(err);
        }
    }

    /**
     * Handle incoming WebSocket messages
     */
    handleMessage(data) {
        switch (data.type) {
            case 'analytics_update':
                this.notifyAnalyticsUpdate(data.data);
                this.updateDashboardCharts(data.data);
                break;
                
            case 'pathway_update':
                this.notifyPathwayUpdate(data.data);
                this.updateLearningPath(data.data);
                break;
                
            default:
                console.warn('Unknown message type:', data.type);
        }
    }

    /**
     * Update dashboard charts with new analytics data
     */
    updateDashboardCharts(analyticsData) {
        // Update engagement score chart
        if (window.engagementChart && analyticsData.engagement_score) {
            window.engagementChart.data.datasets[0].data.push(analyticsData.engagement_score);
            if (window.engagementChart.data.datasets[0].data.length > 10) {
                window.engagementChart.data.datasets[0].data.shift();
            }
            window.engagementChart.update();
        }

        // Update mastery level chart
        if (window.masteryChart && analyticsData.mastery) {
            Object.entries(analyticsData.mastery.by_topic).forEach(([topic, score]) => {
                const datasetIndex = window.masteryChart.data.labels.indexOf(topic);
                if (datasetIndex !== -1) {
                    window.masteryChart.data.datasets[0].data[datasetIndex] = score;
                } else {
                    window.masteryChart.data.labels.push(topic);
                    window.masteryChart.data.datasets[0].data.push(score);
                }
            });
            window.masteryChart.update();
        }

        // Update risk assessment indicators
        if (analyticsData.risk_assessment) {
            const riskLevel = analyticsData.risk_assessment.overall_risk;
            const riskIndicator = document.getElementById('risk-indicator');
            if (riskIndicator) {
                riskIndicator.className = `risk-indicator ${riskLevel}`;
                riskIndicator.textContent = `Risk Level: ${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}`;
            }

            // Update risk factors list
            const riskFactorsList = document.getElementById('risk-factors');
            if (riskFactorsList && analyticsData.risk_assessment.factors) {
                riskFactorsList.innerHTML = analyticsData.risk_assessment.factors
                    .map(factor => `<li class="risk-factor">${factor}</li>`)
                    .join('');
            }
        }

        // Update recommendations
        if (analyticsData.recommendations) {
            const recommendationsList = document.getElementById('learning-recommendations');
            if (recommendationsList) {
                recommendationsList.innerHTML = analyticsData.recommendations
                    .map(rec => `
                        <div class="recommendation-card ${rec.priority}">
                            <h4>${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}</h4>
                            <p>${rec.suggestion}</p>
                            ${rec.topic ? `<span class="topic-tag">${rec.topic}</span>` : ''}
                        </div>
                    `)
                    .join('');
            }
        }
    }

    /**
     * Update learning pathway visualization
     */
    updateLearningPath(pathwayData) {
        const pathwayContainer = document.getElementById('learning-pathway');
        if (!pathwayContainer) return;

        // Clear existing pathway
        pathwayContainer.innerHTML = '';

        // Create new pathway visualization
        const pathway = document.createElement('div');
        pathway.className = 'pathway-container';

        pathwayData.nodes.forEach((node, index) => {
            const nodeElement = document.createElement('div');
            nodeElement.className = `pathway-node ${node.status}`;
            nodeElement.innerHTML = `
                <div class="node-content">
                    <h4>${node.title}</h4>
                    <p>${node.description}</p>
                    <div class="node-progress">
                        <div class="progress-bar" style="width: ${node.progress}%"></div>
                    </div>
                </div>
            `;

            // Add connecting lines between nodes
            if (index < pathwayData.nodes.length - 1) {
                const connector = document.createElement('div');
                connector.className = 'pathway-connector';
                pathway.appendChild(connector);
            }

            pathway.appendChild(nodeElement);
        });

        pathwayContainer.appendChild(pathway);
    }

    /**
     * Attempt to reconnect to the WebSocket server
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
            
            // Exponential backoff
            this.reconnectDelay *= 2;
        } else {
            console.error('Max reconnection attempts reached');
            this.notifyError(new Error('Failed to reconnect to analytics server'));
        }
    }

    /**
     * Register callback functions for different events
     */
    on(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(callback);
        }
    }

    /**
     * Notify subscribers of analytics updates
     */
    notifyAnalyticsUpdate(data) {
        this.callbacks.onAnalyticsUpdate.forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error('Error in analytics update callback:', err);
            }
        });
    }

    /**
     * Notify subscribers of pathway updates
     */
    notifyPathwayUpdate(data) {
        this.callbacks.onPathwayUpdate.forEach(callback => {
            try {
                callback(data);
            } catch (err) {
                console.error('Error in pathway update callback:', err);
            }
        });
    }

    /**
     * Notify subscribers of errors
     */
    notifyError(error) {
        this.callbacks.onError.forEach(callback => {
            try {
                callback(error);
            } catch (err) {
                console.error('Error in error callback:', err);
            }
        });
    }

    /**
     * Clean up resources
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

// Create and export analytics client instance
window.createAnalyticsClient = (studentId) => {
    const client = new AnalyticsClient(studentId);
    return client;
};