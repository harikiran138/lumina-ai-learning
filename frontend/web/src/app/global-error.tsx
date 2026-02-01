"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="bg-black text-white flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white/5 border border-white/10 rounded-2xl max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">
            Something went wrong!
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            A critical error occurred in the application.
            <br />
            <span className="font-mono text-xs opacity-50">
              {error.name}: {error.message}
            </span>
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-lumina-primary text-black font-bold rounded-lg hover:bg-white transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
