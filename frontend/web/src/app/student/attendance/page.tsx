"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2, 
  TrendingUp, 
  CalendarDays,
  Percent,
  BookOpen
} from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function StudentAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-white flex items-center gap-3"><Loader2 className="animate-spin" /> Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}

function AttendanceContent() {
  const router = useRouter();
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, present: 0, percentage: 0 });

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await api.getStudentAttendance();
        setAttendance(data);
        
        // Calculate stats
        const total = data.length;
        const present = data.filter((a: any) => a.is_present).length;
        const percentage = total > 0 ? (present / total) * 100 : 0;
        setStats({ total, present, percentage });
      } catch (e) {
        console.error("Failed to fetch attendance", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CalendarDays className="text-amber-500" />
            Attendance History
          </h1>
          <p className="text-gray-400">
            Track your class attendance and maintaining your minimum requirements.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-1">
              <TrendingUp size={16} className="text-amber-500" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Attendance Rate</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.percentage.toFixed(1)}%</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-1">
              <CheckCircle2 size={16} className="text-green-500" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Present Classes</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.present} / {stats.total}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="text-amber-500 w-5 h-5" />
            Recent Activity
          </h2>

          {attendance.length === 0 ? (
            <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-12 text-center">
              <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No attendance records found yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendance.map((record, idx) => (
                <div 
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      record.is_present ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {record.is_present ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-amber-400 transition-colors">
                        {record.course_name || "Unknown Course"}
                      </h4>
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(record.class_date).toLocaleDateString("en-US", { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold uppercase tracking-wider ${
                      record.is_present ? "text-green-400" : "text-red-400"
                    }`}>
                      {record.status || (record.is_present ? "Present" : "Absent")}
                    </div>
                    {record.faculty_name && (
                        <div className="text-xs text-gray-500 mt-1">Marked by: {record.faculty_name}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar / Requirements */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-3xl p-6 backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Percent className="text-amber-500 w-5 h-5" />
              Requirement Tracker
            </h3>
            <div className="space-y-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Target (75%)</span>
                    <span className="text-white font-medium">{stats.percentage >= 75 ? "Achieved" : "Off-track"}</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10">
                    <div 
                        className={`h-full transition-all duration-1000 ${stats.percentage >= 75 ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]"}`}
                        style={{ width: `${Math.min(stats.percentage, 100)}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                    Engineering standards require 75% attendance for exam eligibility. Keep exploring and attending classes!
                </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
             <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="text-blue-400 w-5 h-5" />
              Learning Tips
            </h3>
            <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex gap-3 text-white">
                    <div className="w-1 h-5 bg-amber-500 rounded-full flex-shrink-0" />
                    Consistent attendance improves grade outcomes by up to 40%.
                </li>
                <li className="flex gap-3">
                    <div className="w-1 h-5 bg-white/10 rounded-full flex-shrink-0" />
                    Review session materials before class to stay engaged.
                </li>
                <li className="flex gap-3">
                    <div className="w-1 h-5 bg-white/10 rounded-full flex-shrink-0" />
                    Use the Lumina Tutoring bot to summarize missed lectures.
                </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
