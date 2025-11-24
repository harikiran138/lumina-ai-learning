'use client';

import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg
                            className="h-6 w-6 text-red-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Oops! Something went wrong
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        We encountered an unexpected error. Don&apos;t worry, our team has been notified.
                    </p>
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-4 p-4 bg-red-50 rounded-md">
                            <p className="text-sm font-mono text-red-800 break-all">
                                {error.message}
                            </p>
                            {error.digest && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={reset}
                        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Try again
                    </button>
                    <Link
                        href="/"
                        className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        </div>
    );
}
