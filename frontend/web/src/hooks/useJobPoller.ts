import { useState, useEffect, useRef } from "react";

type JobStatus = "queued" | "processing" | "complete" | "failed" | null;

interface JobResult<T = unknown> {
  status: JobStatus;
  result: T | null;
  error: string | null;
  /** Stop polling manually (e.g. on component unmount or user cancel) */
  cancel: () => void;
}

/**
 * Polls /api/jobs/:jobId at the given interval until the job reaches a terminal state.
 *
 * Usage:
 *   const { status, result } = useJobPoller<QuizResult>(jobId);
 *
 * Returns immediately with status=null when jobId is null.
 * Stops polling when status is 'complete' or 'failed'.
 */
export function useJobPoller<T = unknown>(
  jobId: string | null,
  intervalMs = 2000,
): JobResult<T> {
  const [status, setStatus] = useState<JobStatus>(null);
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cancel = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!jobId) {
      setStatus(null);
      setResult(null);
      setError(null);
      return;
    }

    // Immediate first poll
    const poll = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) {
          setError(`HTTP ${res.status}`);
          cancel();
          return;
        }
        const data = await res.json();
        const s: JobStatus = data.status ?? null;
        setStatus(s);

        if (s === "complete") {
          setResult(data.result as T);
          cancel();
        } else if (s === "failed") {
          setError(data.error_message ?? "Job failed");
          cancel();
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Network error");
        cancel();
      }
    };

    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return cancel;
  }, [jobId, intervalMs]);

  return { status, result, error, cancel };
}
