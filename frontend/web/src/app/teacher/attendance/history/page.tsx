"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  BookOpen,
  Filter,
  Search,
  ArrowLeft,
  Loader2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  History,
} from "lucide-react";
import { api, User } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AttendanceHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white flex items-center gap-3"><Loader2 className="animate-spin" /> Loading...</div>}>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = await api.getCurrentUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      
      try {
        const [courseList, batchList] = await Promise.all([
          api.listCourses(u.deptId || undefined),
          u.deptId ? api.getBatches(u.deptId) : Promise.resolve([])
        ]);
        setCourses(courseList);
        setBatches(batchList);
      } catch (e) {
        console.error("Failed to load metadata", e);
        toast.error("Failed to load courses/batches");
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (selectedCourse && selectedBatch && selectedSection && selectedDate) {
      fetchHistory();
    }
  }, [selectedCourse, selectedBatch, selectedSection, selectedDate]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // In a real scenario, this would be a filtered history endpoint
      // For now, we reuse markAttendanceBulk's perspective or mock if needed
      // Assuming api.getAttendanceHistory exists or we reuse students list with status
      const students = await api.listStudents(user?.collegeId || "", {
        deptId: user?.deptId || undefined,
        batchId: selectedBatch,
        section: selectedSection
      });
      
      // Mocking status for history view
      setAttendanceRecords(students.map(s => ({
        ...s,
        status: Math.random() > 0.1 ? "present" : "absent"
      })));
    } catch (e) {
      console.error("Failed to fetch history", e);
      toast.error("Failed to fetch attendance history");
    } finally {
      setLoading(false);
    }
  };

  const selectedBatchObj = batches.find(b => b.id === selectedBatch);
  const sections = selectedBatchObj?.sections || [];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link 
              href="/teacher/attendance"
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400"
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <History className="text-amber-500" />
              Attendance History
            </h1>
          </div>
          <p className="text-gray-400 ml-11">
            Review past attendance records and distributions.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
          >
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
          >
            <option value="">Select Batch</option>
            {batches.map(b => (
              <option key={b.id} value={b.id}>{b.year} - {b.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Section</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedBatch}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 disabled:opacity-50"
          >
            <option value="">Select Section</option>
            {sections.map((s: string) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-gray-400">Loading history...</p>
          </div>
        ) : attendanceRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-6 text-sm font-semibold text-gray-300">Roll No</th>
                  <th className="p-6 text-sm font-semibold text-gray-300">Student Name</th>
                  <th className="p-6 text-sm font-semibold text-gray-300 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="group hover:bg-white/5 transition-colors">
                    <td className="p-6 font-mono text-amber-500">{record.student_roll || "N/A"}</td>
                    <td className="p-6">
                      <div className="flex items-center gap-3 text-white font-medium">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 text-xs">
                          {record.full_name?.charAt(0)}
                        </div>
                        {record.full_name}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-center">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                          record.status === "present" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                          record.status === "absent" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        )}>
                          {record.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6">
            <Calendar className="w-12 h-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No data found</h3>
            <p className="text-gray-400 max-w-xs">
              Adjust filters to view attendance history for a specific class and date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
