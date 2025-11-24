// API Error Handler - Consistent error handling for API calls

import { logError } from './error-logger';

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode?: number,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

// Map common error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
    NOT_FOUND: 'The requested resource was not found.',
    UNAUTHORIZED: 'You are not authorized to access this resource.',
    FORBIDDEN: 'Access to this resource is forbidden.',
    INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
    NETWORK_ERROR: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    INVALID_REQUEST: 'Invalid request. Please check your input.',
};

export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && ERROR_MESSAGES[error.code]) {
        return ERROR_MESSAGES[error.code];
    }

    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        return error.message;
    }

    return 'An unexpected error occurred.';
}

export function handleApiError(error: unknown, context?: Record<string, unknown>): ApiError {
    // Log the error - convert unknown to Error or string
    const errorToLog = error instanceof Error ? error : String(error);
    logError(errorToLog, { ...context, type: 'API_ERROR' });

    // Convert to ApiError if not already
    if (error instanceof ApiError) {
        return error;
    }

    // Handle network errors
    if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
        if (error.message.includes('fetch') || error.message.includes('network')) {
            return new ApiError(
                ERROR_MESSAGES.NETWORK_ERROR,
                0,
                'NETWORK_ERROR',
                error
            );
        }

        // Handle timeout errors
        if (error.message.includes('timeout')) {
            return new ApiError(
                ERROR_MESSAGES.TIMEOUT,
                408,
                'TIMEOUT',
                error
            );
        }
    }

    // Default error
    const statusCode = error && typeof error === 'object' && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500;
    const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : 'INTERNAL_ERROR';

    return new ApiError(
        getErrorMessage(error),
        statusCode,
        code,
        error
    );
}

// Retry logic for transient failures
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on client errors (4xx)
            if (error instanceof ApiError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
                throw error;
            }

            // Wait before retrying (exponential backoff)
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
            }
        }
    }

    throw handleApiError(lastError, { retries: maxRetries });
}
