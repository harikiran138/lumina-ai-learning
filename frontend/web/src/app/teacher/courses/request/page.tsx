"use client";

import { useEffect, useState } from "react";
import { 
  BookOpen, 
  Search, 
  Users, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RealAPI } from "@/lib/api";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface ClassSection {
  id: string;
  section_name: string;
  batch_name: string;
  program_name: string;
  semester_number: number;
}

export default function TeacherRequestPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const api = RealAPI.getInstance();

  useEffect(() => {
    const load = async () => {
      try {
        const [courseData, classData] = await Promise.all([
          api.getAllCourses(),
          api.getClasses(),
        ]);
        setCourses(courseData);
        setClasses(classData);
      } catch (err) {
        console.error("failed_to_load_data", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRequest = async (courseId: string, classId: string) => {
    const key = `${courseId}-${classId}`;
    setRequesting(key);
    try {
      await api.requestTeacherAssignment(courseId, classId);
      alert("✅ Request submitted! An admin will review it shortly.");
    } catch (err) {
      console.error("request_failed", err);
      alert("❌ Failed to submit request. You might already have a pending request for this section.");
    } finally {
      setRequesting(null);
    }
  };

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-warning" />
    </div>
  );

  const filteredClasses = classes.filter(cls => 
    cls.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.program_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-warning" />
          Request Course Access
        </h1>
        <p className="mt-1 text-text-muted">Select the courses and sections you teach to start managing curriculum and AI tutoring.</p>
      </header>

      <div className="glass-v2 border-border p-4 flex items-center justify-between">
         <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input 
              type="text" 
              placeholder="Search by program or section..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface py-2 pl-10 pr-4 text-sm text-foreground focus:outline-none"
            />
         </div>
         <div className="flex items-center gap-2 text-[10px] text-text-secondary font-bold uppercase tracking-widest">
            <Clock className="h-4 w-4" />
            Admin approval required
         </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="glass-v2 border-border overflow-hidden group">
            <div className="p-5 border-b border-border bg-surface/50">
              <p className="text-[10px] font-bold text-warning uppercase tracking-[0.2em] mb-1">{course.code}</p>
              <h3 className="text-lg font-bold text-foreground group-hover:text-warning transition-colors uppercase leading-tight">{course.name}</h3>
            </div>
            
            <div className="p-4 space-y-3">
              <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-2 flex items-center gap-2">
                 <Layers className="h-3 w-3" />
                 Available Sections
              </p>
              <div className="grid gap-2">
                {filteredClasses.map((cls) => (
                  <div key={cls.id} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border hover:border-border/80 transition-all hover:bg-surface-elevated">
                    <div>
                      <p className="text-[11px] font-bold text-foreground uppercase">Section {cls.section_name}</p>
                      <p className="text-[9px] text-text-secondary uppercase font-medium">{cls.program_name} • Sem {cls.semester_number}</p>
                    </div>
                    <button 
                      onClick={() => handleRequest(course.id, cls.id)}
                      disabled={requesting === `${course.id}-${cls.id}`}
                      className="p-2 rounded-lg bg-warning/10 text-warning hover:bg-warning hover:text-black transition-all group/btn"
                    >
                      {requesting === `${course.id}-${cls.id}` ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="py-20 text-center glass-v2 border-border">
           <AlertCircle className="h-12 w-12 text-text-secondary mx-auto mb-4" />
           <p className="text-text-muted italic">No courses available for assignment. Please contact an admin.</p>
        </div>
      )}
    </div>
  );
}
