// Error logging utility for centralized error tracking

export interface ErrorLog {
    message: string;
    stack?: string;
    timestamp: string;
    url?: string;
    userAgent?: string;
    context?: Record<string, unknown>;
}

class ErrorLogger {
    private logs: ErrorLog[] = [];
    private isDevelopment = process.env.NODE_ENV === 'development';

    log(error: Error | string, context?: Record<string, unknown>) {
        const errorLog: ErrorLog = {
            message: typeof error === 'string' ? error : error.message,
            stack: typeof error === 'string' ? undefined : error.stack,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
            context,
        };

        this.logs.push(errorLog);

        // Log to console in development
        if (this.isDevelopment) {
            console.error('Error logged:', errorLog);
        }

        // In production, you could send to a monitoring service
        // Example: sendToMonitoringService(errorLog);

        return errorLog;
    }

    getLogs(): ErrorLog[] {
        return [...this.logs];
    }

    clearLogs() {
        this.logs = [];
    }

    // Get recent errors (last 10)
    getRecentErrors(count: number = 10): ErrorLog[] {
        return this.logs.slice(-count);
    }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Helper function to log errors
export function logError(error: Error | string, context?: Record<string, unknown>) {
    return errorLogger.log(error, context);
}
