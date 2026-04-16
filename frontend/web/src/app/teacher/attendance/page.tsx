"use client";

import AttendanceTracker from "@/components/teacher/AttendanceTracker";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

/**
 * Attendance Tracker Page
 * 
 * This page uses the modular AttendanceTracker component to allow
 * faculty members to mark and synchronize student presence.
 */
export default function AttendancePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-32 bg-surface/40 rounded-3xl border border-border backdrop-blur-xl">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest text-text-secondary animate-pulse">Initializing Streams...</p>
        </div>
      }>
        <AttendanceTracker standalone={true} />
      </Suspense>
    </div>
  );
}
