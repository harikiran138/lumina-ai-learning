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
      <body className="bg-background text-foreground flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-surface-elevated border border-border rounded-2xl max-w-md shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-destructive">
            Something went wrong!
          </h2>
          <p className="text-text-secondary mb-6 text-sm">
            A critical error occurred in the application.
            <br />
              <span className="font-mono text-xs text-text-secondary">
              {error.name}: {error.message}
            </span>
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary-hover transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
