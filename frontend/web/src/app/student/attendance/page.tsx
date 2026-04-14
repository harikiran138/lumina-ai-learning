"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ subjects: any[]; threshold: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getStudentAttendance();
        setData(res);
      } catch (err: any) {
        setError(err?.message || "Failed to load attendance");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto text-white space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance</h1>
        <p className="text-gray-400">Track your attendance by subject.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin w-8 h-8 text-amber-500" />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      ) : (
        <div className="space-y-4">
          {(data?.subjects || []).map((row: any) => (
            <div
              key={row.courseId}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between"
            >
              <div>
                <h3 className="text-lg font-semibold">{row.courseName}</h3>
                <p className="text-sm text-gray-400">
                  {row.presentClasses}/{row.totalClasses} classes attended
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    row.attendancePercent < (data?.threshold || 75)
                      ? "text-amber-400"
                      : "text-green-400"
                  }`}
                >
                  {row.attendancePercent}%
                </div>
                {row.attendancePercent < (data?.threshold || 75) && (
                  <div className="text-xs text-amber-300 mt-1">
                    Below {data?.threshold || 75}%
                  </div>
                )}
              </div>
            </div>
          ))}
          {data?.subjects?.length === 0 && (
            <div className="text-gray-400">No attendance data yet.</div>
          )}
        </div>
      )}
    </div>
  );
}
