"use client";

import { useState, useEffect } from "react";
import {
  Users,
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
  UserCheck,
  ArrowRightLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import RequestOverrideModal from "./RequestOverrideModal";

interface AttendanceTrackerProps {
  initialCourseId?: string;
  initialBatchId?: string;
  initialSection?: string;
  onClose?: () => void;
  className?: string;
  standalone?: boolean;
}

export default function AttendanceTracker({
  initialCourseId = "",
  initialBatchId = "",
  initialSection = "",
  className,
  standalone = true,
}: AttendanceTrackerProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId);
  const [selectedBatch, setSelectedBatch] = useState(initialBatchId);
  const [selectedSection, setSelectedSection] = useState(initialSection);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent" | "late">>({});
  const [loading, setLoading] = useState(false);
  const [fetchingStudents, setFetchingStudents] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [overrideStudent, setOverrideStudent] = useState<any | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const user = await api.getCurrentUser();
        setCurrentUser(user);
        if (!user) return;

        const [courseList, batchList] = await Promise.all([
          api.listCourses(user.deptId || undefined),
          user.deptId ? api.getBatches(user.deptId) : Promise.resolve([]),
        ]);
        setCourses(courseList);
        setBatches(batchList);
      } catch (e) {
        console.error("Failed to load metadata", e);
        toast.error("Failed to load course and batch settings");
      }
    };
    loadMetadata();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedBatch && selectedSection) {
      fetchStudents();
    }
  }, [selectedCourse, selectedBatch, selectedSection]);

  const fetchStudents = async () => {
    const user = await api.getCurrentUser();
    if (!user?.collegeId) return;

    setFetchingStudents(true);
    try {
      const list = await api.listStudents(user.collegeId, {
        deptId: user.deptId || undefined,
        batchId: selectedBatch,
        section: selectedSection,
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
      toast.error("Unable to load student list");
    } finally {
      setFetchingStudents(false);
    }
  };

  const updateStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: "present" | "absent" | "late") => {
    const updated = { ...attendance };
    students.forEach((s) => {
      updated[s.id] = status;
    });
    setAttendance(updated);
  };

  const handleSave = async () => {
    if (!selectedCourse || !selectedBatch || !selectedSection || !selectedDate) {
      toast.error("Please ensure all class criteria are selected");
      return;
    }

    setLoading(true);
    try {
      const bulkRecords = students.map((s) => ({
        course_id: selectedCourse,
        student_id: s.id,
        batch_id: selectedBatch,
        section: selectedSection,
        class_date: selectedDate,
        is_present: attendance[s.id] === "present" || attendance[s.id] === "late",
        status: attendance[s.id],
      }));

      await api.markAttendanceBulk(bulkRecords);
      toast.success("Attendance intelligence updated!");
    } catch (e) {
      console.error("Failed to save attendance", e);
      toast.error("Failed to sync attendance data");
    } finally {
      setLoading(false);
    }
  };

  const selectedBatchObj = batches.find((b) => b.id === selectedBatch);
  const sections = selectedBatchObj?.sections || [];

  const filteredStudents = students.filter(s => 
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_roll?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn("space-y-6", className)}>
      {standalone && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-text flex items-center gap-3">
              <UserCheck className="text-primary" />
              Attendance Intel
            </h2>
            <p className="text-sm text-text-secondary">Mark and synchronize student presence for the intelligence grid.</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2.5 bg-surface border border-border rounded-xl text-text outline-none focus:border-primary/50 transition-all text-sm"
            />
            <button
              onClick={handleSave}
              disabled={loading || students.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:brightness-110 text-primary-foreground font-black rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 size={18} />}
              {loading ? "Syncing..." : "Sync Attendance"}
            </button>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface-elevated p-5 rounded-2xl border border-border">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Course Stream</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-text text-sm outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select Stream</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Academic Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => {
              setSelectedBatch(e.target.value);
              setSelectedSection("");
            }}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-text text-sm outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer"
          >
            <option value="">Select Batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.year} - {b.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Section Hub</label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedBatch}
            className="w-full p-2.5 bg-surface border border-border rounded-xl text-text text-sm outline-none focus:border-primary/50 transition-all disabled:opacity-30 appearance-none cursor-pointer"
          >
            <option value="">Select Section</option>
            {sections.map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {students.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Find student..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-xl text-sm text-text outline-none focus:border-primary/30 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
              <span className="text-xs font-bold text-text-muted uppercase tracking-tighter whitespace-nowrap">Bulk Actions:</span>
              <button
                onClick={() => markAll("present")}
                className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                All Present
              </button>
              <button
                onClick={() => markAll("absent")}
                className="px-3 py-1.5 rounded-lg bg-red-400/10 text-red-500 dark:text-red-400 border border-red-400/20 hover:bg-red-400/20 transition-all text-[10px] font-black uppercase tracking-widest whitespace-nowrap"
              >
                All Absent
              </button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-3xl overflow-hidden shadow-sm">
            {fetchingStudents ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="text-sm text-text-secondary font-medium animate-pulse">Accessing class data...</p>
              </div>
            ) : filteredStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-elevated border-b border-border">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Student Identity</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted text-center">Engagement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="group hover:bg-surface-elevated transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-sm shadow-lg shadow-primary/10">
                              {student.full_name?.charAt(0) || "S"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text group-hover:text-primary transition-colors leading-tight">
                                {student.full_name}
                              </p>
                              <p className="text-[10px] font-mono text-text-muted mt-0.5 tracking-tight">
                                {student.student_roll || "SID-XXXX"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {[
                              { id: "present", icon: CheckCircle2, label: "Present", color: "green" },
                              { id: "late", icon: Clock, label: "Late", color: "amber" },
                              { id: "absent", icon: XCircle, label: "Absent", color: "red" },
                            ].map((status) => (
                              <button
                                key={status.id}
                                onClick={() => updateStatus(student.id, status.id as any)}
                                className={cn(
                                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all border group/btn",
                                  attendance[student.id] === status.id
                                    ? {
                                      "bg-green-500/20 border-green-500/40 text-green-600 dark:text-green-400": status.color === "green",
                                      "bg-amber-400/20 border-amber-400/40 text-amber-700 dark:text-amber-200": status.color === "amber",
                                      "bg-red-500/20 border-red-500/40 text-red-600 dark:text-red-300": status.color === "red",
                                    }
                                    : "bg-transparent border-transparent text-text-muted hover:bg-surface-elevated hover:text-text-secondary"
                                )}
                              >
                                <status.icon size={16} />
                                <span className="text-[9px] font-black uppercase tracking-tighter">{status.label}</span>
                              </button>
                            ))}
                            {/* Override Trigger */}
                            <button
                              onClick={() => setOverrideStudent(student)}
                              className="ml-2 p-2 rounded-xl bg-surface-elevated border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all flex items-center gap-2"
                              title="Request Override Review"
                            >
                              <ArrowRightLeft size={16} />
                              <span className="text-[9px] font-black uppercase tracking-tighter hidden md:inline">Request Review</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="bg-surface-elevated w-16 h-16 rounded-3xl flex items-center justify-center mb-4 border border-border group">
                  <Users className="w-8 h-8 text-text-muted group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-text mb-2">No students matches</h3>
                <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                  Refine your search or selection criteria above to update the student intelligence grid.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {students.length === 0 && !fetchingStudents && (
        <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-border bg-surface-elevated/20">
          <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-6">
            <Calendar className="w-8 h-8 text-text-muted" />
          </div>
          <h3 className="text-xl font-display font-bold text-text mb-2">Ready for Attendance?</h3>
          <p className="text-sm text-text-secondary max-w-xs text-center px-4 leading-relaxed">
            Select a course stream and batch hub above to initialize the attendance intelligence session.
          </p>
        </div>
      )}

      {overrideStudent && (
        <RequestOverrideModal
          student={overrideStudent}
          currentStatus={attendance[overrideStudent.id]}
          onClose={() => setOverrideStudent(null)}
        />
      )}
    </div>
  );
}

function Calendar(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
