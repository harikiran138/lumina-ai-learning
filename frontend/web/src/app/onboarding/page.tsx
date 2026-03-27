"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowRight, CheckCircle2, Building2, BookOpen, GraduationCap, Users } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

// Optional direct Supabase usage if API endpoints aren't exposed yet
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Step = 1 | 2 | 3 | 4 | 5;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [role, setRole] = useState<string>("student");
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Data states
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Selection states
  const [selectedInst, setSelectedInst] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedProg, setSelectedProg] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    // Determine role and fetch initial institutions
    const init = async () => {
      try {
        const user = await api.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setRole(user.role);

        // Fetch institutions
        const { data, error } = await supabase.from('institutions').select('*');
        if (!error && data) setInstitutions(data);
        
        setFetching(false);
      } catch (e) {
        console.error(e);
        setFetching(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!selectedInst) return;
    const fetchDepts = async () => {
      const { data } = await supabase.from('departments').select('*').eq('institution_id', selectedInst);
      if (data) setDepartments(data);
    };
    fetchDepts();
  }, [selectedInst]);

  useEffect(() => {
    if (!selectedDept || role !== "student") return;
    const fetchProgs = async () => {
      const { data } = await supabase.from('programs').select('*').eq('department_id', selectedDept);
      if (data) setPrograms(data);
    };
    fetchProgs();
  }, [selectedDept, role]);

  useEffect(() => {
    if (!selectedProg || role !== "student") return;
    const fetchSemesters = async () => {
      const { data } = await supabase.from('semesters').select('*').eq('program_id', selectedProg).order('semester_number');
      if (data) setSemesters(data);
    };
    fetchSemesters();
  }, [selectedProg, role]);

  useEffect(() => {
    if (!selectedProg || !selectedSemester || role !== "student") return;
    const fetchClasses = async () => {
      const { data } = await supabase
        .from('classes')
        .select('*')
        .eq('program_id', selectedProg)
        .eq('semester_id', selectedSemester);
      if (data) setClasses(data);
    };
    fetchClasses();
  }, [selectedProg, selectedSemester, role]);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const user = await api.getCurrentUser();
      if (!user) throw new Error("Not authenticated");

      // Register the associations (Student -> Program/Semester/Class, Teacher -> Department)
      if (role === "student") {
        const semester = semesters.find((item) => item.id === selectedSemester);
        const semesterNumber = Number(semester?.semester_number || 1);
        const yearOfStudy = Math.max(1, Math.ceil(semesterNumber / 2));

        const { data: existingEnrollment } = await supabase
          .from('student_enrollments')
          .select('id')
          .eq('student_id', user.id)
          .maybeSingle();

        const enrollmentPayload = {
          student_id: user.id,
          program_id: selectedProg,
          current_semester_id: selectedSemester,
          class_id: selectedClass,
          year_of_study: yearOfStudy,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        };

        if (existingEnrollment?.id) {
          await supabase
            .from('student_enrollments')
            .update(enrollmentPayload)
            .eq('id', existingEnrollment.id);
        } else {
          await supabase.from('student_enrollments').insert(enrollmentPayload);
        }
      }

      if (selectedDept) {
        await supabase.from('users').update({ department_id: selectedDept }).eq('id', user.id);
      }

      const { data: existingUserData } = await supabase
        .from('user_data')
        .select('progress')
        .eq('user_id', user.id)
        .maybeSingle();

      const previousProgress = (existingUserData?.progress as Record<string, any>) || {};

      await supabase.from('user_data').upsert({
        user_id: user.id,
        progress: {
          ...previousProgress,
          onboarding_status: 'COMPLETED',
          onboarding: {
            role,
            institution_id: selectedInst,
            department_id: selectedDept,
            program_id: selectedProg || null,
            semester_id: selectedSemester || null,
            class_id: selectedClass || null,
            completed_at: new Date().toISOString(),
          },
        },
      }, { onConflict: 'user_id' });

      // Update user status as a safe default for legacy checks
      await supabase.from('users').update({ status: 'active' }).eq('id', user.id);
      
      toast.success("Onboarding complete!");
      router.push(`/${role}/dashboard`);
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1 && !selectedInst) return true;
    if (currentStep === 2 && !selectedDept) return true;
    if (role === "student" && currentStep === 3 && !selectedProg) return true;
    if (role === "student" && currentStep === 4 && !selectedSemester) return true;
    if (role === "student" && currentStep === 5 && !selectedClass) return true;
    return false;
  };

  const nextStep = () => {
    if (role !== "student" && currentStep === 2) {
      handleComplete();
      return;
    }
    if (currentStep === 5) {
      handleComplete();
    } else {
      setCurrentStep((c) => (c + 1) as Step);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="w-12 h-12 border-4 border-lumina-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex items-center justify-center overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Lumina</span>
          </h1>
          <p className="text-gray-400 text-lg">Let's set up your academic profile</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-12 gap-2">
           {[1, 2, 3, 4, 5].filter(s => role === "student" || s <= 2).map((s) => (
             <div key={s} className="flex items-center">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${currentStep === s ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-110' : currentStep > s ? 'bg-purple-500/80 text-white' : 'bg-white/5 border border-white/10 text-gray-500'}`}>
                 {currentStep > s ? <CheckCircle2 className="w-5 h-5" /> : s}
               </div>
               {s < (role === "student" ? 5 : 2) && (
                 <div className={`h-1 w-12 mx-2 rounded-full transition-all duration-500 ${currentStep > s ? 'bg-gradient-to-r from-purple-500 to-blue-500' : 'bg-white/10'}`}></div>
               )}
             </div>
           ))}
        </div>

        {/* Card Content */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl transition-all duration-500 min-h-[400px] flex flex-col justify-between">
          
          {/* STEP 1: Institution */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-xl"><Building2 className="w-6 h-6 text-blue-400" /></div>
                <h2 className="text-2xl font-bold">Select Institution</h2>
              </div>
              <div className="grid gap-4 mt-6">
                {institutions.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => setSelectedInst(inst.id)}
                    className={`text-left p-5 rounded-2xl border transition-all duration-300 ${selectedInst === inst.id ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h3 className="font-semibold text-lg">{inst.institution_name || inst.name}</h3>
                    {inst.city && <p className="text-sm text-gray-400 mt-1">{inst.city}</p>}
                  </button>
                ))}
                {institutions.length === 0 && <p className="text-gray-500 p-4 text-center">No institutions available.</p>}
              </div>
            </div>
          )}

          {/* STEP 2: Department */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-purple-500/20 rounded-xl"><Users className="w-6 h-6 text-purple-400" /></div>
                <h2 className="text-2xl font-bold">Select Department</h2>
              </div>
              <div className="grid gap-4 mt-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 ${selectedDept === dept.id ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h3 className="font-semibold">{dept.department_name || dept.name}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Program (Student only) */}
          {currentStep === 3 && role === "student" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-cyan-500/20 rounded-xl"><BookOpen className="w-6 h-6 text-cyan-400" /></div>
                <h2 className="text-2xl font-bold">Select Program</h2>
              </div>
              <div className="grid gap-4 mt-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                {programs.map(prog => (
                  <button
                    key={prog.id}
                    onClick={() => setSelectedProg(prog.id)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 ${selectedProg === prog.id ? 'bg-cyan-500/20 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h3 className="font-semibold">{prog.program_name || prog.name}</h3>
                    {(prog.degree || prog.level) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {[prog.degree, prog.level].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Semester (Student only) */}
          {currentStep === 4 && role === "student" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-500/20 rounded-xl"><BookOpen className="w-6 h-6 text-indigo-400" /></div>
                <h2 className="text-2xl font-bold">Select Semester</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                {semesters.map(sem => (
                  <button
                    key={sem.id}
                    onClick={() => setSelectedSemester(sem.id)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 ${selectedSemester === sem.id ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h3 className="font-semibold">{sem.title || `Semester ${sem.semester_number}`}</h3>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 5: Class (Student only) */}
          {currentStep === 5 && role === "student" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-xl"><GraduationCap className="w-6 h-6 text-emerald-400" /></div>
                <h2 className="text-2xl font-bold">Select Your Class</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 ${selectedClass === cls.id ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                    <h3 className="font-semibold">{cls.class_name || cls.section_name || cls.section || 'Class'}</h3>
                    <p className="text-sm text-gray-400 mt-1">Batch: {cls.batch_name || cls.batch || cls.academic_year || '—'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center mt-10 pt-6 border-t border-white/10">
            <button 
              onClick={() => setCurrentStep(c => Math.max(1, c - 1) as Step)}
              disabled={currentStep === 1 || isLoading}
              className="px-6 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-0"
            >
              Back
            </button>
            <button
              onClick={nextStep}
              disabled={isNextDisabled() || isLoading}
              className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-bold bg-white text-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            >
              {isLoading ? 'Processing...' : (currentStep === (role === "student" ? 5 : 2) ? 'Complete' : 'Continue')}
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
