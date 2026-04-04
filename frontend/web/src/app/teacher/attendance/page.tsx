"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
} from "lucide-react";
import { api, User } from "@/lib/api";
import { toast } from "sonner";

export default function FacultyAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-white flex items-center gap-3"><Loader2 className="animate-spin" /> Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}

function AttendanceContent() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "late">>({});
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);

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
    if (selectedCourse && selectedBatch && selectedSection && user?.collegeId) {
      fetchStudents();
    }
  }, [selectedCourse, selectedBatch, selectedSection]);

  const fetchStudents = async () => {
    if (!user?.collegeId) return;
    setFetchingStudents(true);
    try {
      const list = await api.listStudents(user.collegeId, {
        deptId: user.deptId || undefined,
        batchId: selectedBatch,
        section: selectedSection
      });
      setStudents(list);
      
      // Initialize attendance records
      const initial: Record<string, "present" | "absent" | "late"> = {};
      list.forEach((s: any) => {
        initial[s.id] = "present";
      });
      setAttendance(initial);
    } catch (e) {
      console.error("Failed to fetch students", e);
      toast.error("Failed to fetch students for this batch");
    } finally {
      setFetchingStudents(false);
    }
  };

  const updateStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: "present" | "absent" | "late") => {
    const updated = { ...attendance };
    students.forEach(s => {
      updated[s.id] = status;
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedBatch || !selectedSection || !selectedDate) {
      toast.error("Please fill all selection criteria");
      return;
    }

    setLoading(true);
    try {
      const records = students.map(s => ({
        course_id: selectedCourse,
        student_id: s.id,
        batch_id: selectedBatch,
        section: selectedSection,
        class_date: selectedDate,
        is_present: attendance[s.id] === "present" || attendance[s.id] === "late",
        status: attendance[s.id] // "present", "absent", "late"
      }));

      await api.markAttendanceBulk(records);
      toast.success("Attendance saved successfully!");
    } catch (e) {
      console.error("Failed to save attendance", e);
      toast.error("Failed to save attendance");
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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <CalendarDays className="text-amber-500" />
            Attendance Tracker
          </h1>
          <p className="text-gray-400">
            Select a class and mark student attendance for today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={loading || students.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={20} />}
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>
      </div>

      {/* Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Course / Subject</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full p-3 bg-black/20 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
          >
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Batch / Year</label>
          <select
            value={selectedBatch}
            onChange={(e) => {
              setSelectedBatch(e.target.value);
              setSelectedSection(""); // Reset section when batch changes
            }}
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

      {/* Bulk Actions */}
      {students.length > 0 && (
        <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-400">Quick Mark:</span>
            <button
              onClick={() => markAll("present")}
              className="px-4 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-sm font-semibold"
            >
              All Present
            </button>
            <button
              onClick={() => markAll("absent")}
              className="px-4 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm font-semibold"
            >
              All Absent
            </button>
          </div>
          <div className="text-sm text-gray-400">
            Total Students: <span className="text-white font-bold">{students.length}</span>
          </div>
        </div>
      )}

      {/* Student List */}
      <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl min-h-[400px]">
        {fetchingStudents ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-gray-400">Fetching class list...</p>
          </div>
        ) : students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-6 text-sm font-semibold text-gray-300">Roll No</th>
                  <th className="p-6 text-sm font-semibold text-gray-300">Student Name</th>
                  <th className="p-6 text-sm font-semibold text-gray-300 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {students.map((student) => (
                  <tr key={student.id} className="group hover:bg-white/5 transition-colors">
                    <td className="p-6">
                      <span className="text-amber-500 font-mono font-medium">{student.student_roll || "N/A"}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-black font-bold text-xs">
                          {student.full_name?.charAt(0) || "S"}
                        </div>
                        <span className="text-white font-medium">{student.full_name}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateStatus(student.id, "present")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
                            attendance[student.id] === "present"
                              ? "bg-green-500/20 border-green-500/50 text-green-400"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          <CheckCircle2 size={16} />
                          <span className="text-sm font-medium">Present</span>
                        </button>
                        <button
                          onClick={() => updateStatus(student.id, "late")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
                            attendance[student.id] === "late"
                              ? "bg-amber-500/20 border-amber-500/50 text-amber-400"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          <Clock size={16} />
                          <span className="text-sm font-medium">Late</span>
                        </button>
                        <button
                          onClick={() => updateStatus(student.id, "absent")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border ${
                            attendance[student.id] === "absent"
                              ? "bg-red-500/20 border-red-500/50 text-red-400"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          <XCircle size={16} />
                          <span className="text-sm font-medium">Absent</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No students selected</h3>
            <p className="text-gray-400 max-w-xs">
              Select a course, batch, and section above to view the student list and mark attendance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
