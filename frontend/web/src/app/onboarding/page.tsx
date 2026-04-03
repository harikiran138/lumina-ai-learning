"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Building2, 
  Shield, 
  MapPin, 
  Settings, 
  Calendar, 
  ArrowRight, 
  Plus, 
  Mail, 
  Users, 
  Trash2, 
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import StudentOnboardingFlow from "@/components/onboarding/StudentOnboardingFlow";
import RoleOnboardingFlow from "@/components/onboarding/RoleOnboardingFlow";
import { getRoleHome } from "@/lib/role-routing";
import type { SupportedRoleOnboardingRole } from "@/lib/role-onboarding";

type Role =
  | "super_admin"
  | "college_admin"
  | "hod"
  | "teacher"
  | "faculty"
  | "student"
  | "parent"
  | "mentor"
  | "peer_tutor"
  | "researcher";

const structuredRoleFlows: SupportedRoleOnboardingRole[] = [
  "teacher",
  "faculty",
  "parent",
  "mentor",
  "peer_tutor",
  "researcher",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  const [collegeProfile, setCollegeProfile] = useState({
    collegeName: "",
    collegeCode: "",
    city: "",
    state: "",
    academicYear: "",
    logoUrl: "",
  });

  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await api.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        const status = await api.getOnboardingStatus();
        const currentRole = (status.role || user.role) as Role;

        // Roles with no defined onboarding flow get sent straight to their dashboard.
        const hasDefinedFlow =
          currentRole === "college_admin" ||
          currentRole === "student" ||
          structuredRoleFlows.includes(currentRole as SupportedRoleOnboardingRole);

        if (!hasDefinedFlow) {
          await api.completeOnboarding().catch(() => {});
          routeByRole(currentRole);
          return;
        }

        setRole(currentRole);
        setCollegeId(status.collegeId || user.collegeId || null);
        setCurrentStep(status.step || 1);
      } catch (err: any) {
        toast.error("Failed to load onboarding status");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  const routeByRole = (r: Role) => {
    if (r === "super_admin") {
      router.push("/admin");
      return;
    }
    if (r === "college_admin") {
      router.push("/college");
      return;
    }
    if (r === "hod") {
      router.push("/hod");
      return;
    }
    router.push(getRoleHome(r));
  };

  const handleSaveStep = async (handler: () => Promise<void>) => {
    setSaving(true);
    try {
      await handler();
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong — please try again");
    } finally {
      setSaving(false);
    }
  };

  const saveCollegeStep1 = () => handleSaveStep(async () => {
      if (!collegeProfile.collegeName.trim() || !collegeProfile.collegeCode.trim()) {
        toast.error("College name and code are required");
        return;
      }
      if (!collegeId) {
        toast.error("College ID missing — please refresh and try again");
        return;
      }
      await api.updateCollege(collegeId, {
        institution_name: collegeProfile.collegeName,
        code: collegeProfile.collegeCode,
        city: collegeProfile.city,
        state: collegeProfile.state,
        logo_url: collegeProfile.logoUrl,
        academic_year: collegeProfile.academicYear,
      });
      await api.updateOnboardingStep(1, collegeProfile);
      setCurrentStep(2);
  });

  const saveCollegeStep2 = () => handleSaveStep(async () => {
      if (!collegeId) {
        toast.error("College ID missing — please refresh and try again");
        return;
      }
      const validDepts = departments.filter(d => d.name.trim() && d.abbreviation.trim());
      if (validDepts.length === 0) {
        toast.error("Add at least one department with a name and abbreviation");
        return;
      }
      const created: any[] = [];
      for (const dept of validDepts) {
        try {
          const deptRes = await api.createDepartment(collegeId, {
            name: dept.name,
            abbreviation: dept.abbreviation,
            intake_strength: dept.intakeStrength ? Number(dept.intakeStrength) : undefined,
          });
          created.push(deptRes);
          if (dept.hodEmail && deptRes.id) {
            await api.inviteUser(collegeId, {
              email: dept.hodEmail,
              role: "hod",
              deptId: deptRes.id,
            });
          }
        } catch (err: any) {
          toast.error(`Failed to create "${dept.name}": ${err?.message || "Unknown error"}`);
        }
      }
      await api.updateOnboardingStep(2, { departments: created });
      await api.completeOnboarding();
      routeByRole("college_admin");
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090909] px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-5 py-3 text-sm text-amber-100">
            Loading onboarding
          </div>
        </div>
      </div>
    );
  }

  if (role === "student") {
    return <StudentOnboardingFlow />;
  }

  if (role && structuredRoleFlows.includes(role as SupportedRoleOnboardingRole)) {
    return <RoleOnboardingFlow role={role as SupportedRoleOnboardingRole} />;
  }

  return (
    <div className="min-h-screen bg-[#090909] text-white flex flex-col justify-center items-center p-6">
      {/* Main Form Container */}
      <div className="w-full max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="backdrop-blur-3xl bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            {/* Render role-specific content */}
            {role === "college_admin" && (
                <div className="space-y-8">
                    {currentStep === 1 && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">College Name</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-lumina-primary transition-colors" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary transition-all text-white placeholder:text-gray-600 font-medium" 
                                            placeholder="e.g. Stanford University" 
                                            value={collegeProfile.collegeName} 
                                            onChange={e => setCollegeProfile({ ...collegeProfile, collegeName: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">College Code</label>
                                    <div className="relative group">
                                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-lumina-primary transition-colors" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary transition-all text-white placeholder:text-gray-600 font-medium" 
                                            placeholder="e.g. SU-101" 
                                            value={collegeProfile.collegeCode} 
                                            onChange={e => setCollegeProfile({ ...collegeProfile, collegeCode: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
                                    <div className="relative group">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-lumina-primary transition-colors" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary transition-all text-white placeholder:text-gray-600 font-medium" 
                                            placeholder="e.g. Palo Alto" 
                                            value={collegeProfile.city} 
                                            onChange={e => setCollegeProfile({ ...collegeProfile, city: e.target.value })} 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">State</label>
                                    <div className="relative group">
                                        <Settings className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-lumina-primary transition-colors" />
                                        <input 
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary transition-all text-white placeholder:text-gray-600 font-medium" 
                                            placeholder="e.g. California" 
                                            value={collegeProfile.state} 
                                            onChange={e => setCollegeProfile({ ...collegeProfile, state: e.target.value })} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Current Academic Year</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-lumina-primary transition-colors" />
                                    <input 
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-lumina-primary/50 focus:border-lumina-primary transition-all text-white placeholder:text-gray-600 font-medium" 
                                        placeholder="e.g. 2024-2025" 
                                        value={collegeProfile.academicYear} 
                                        onChange={e => setCollegeProfile({ ...collegeProfile, academicYear: e.target.value })} 
                                    />
                                </div>
                            </div>
                            <button 
                                className="w-full py-5 bg-lumina-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-[0_10px_40px_rgba(59,130,246,0.3)] disabled:opacity-50" 
                                onClick={saveCollegeStep1} 
                                disabled={saving}
                            >
                                {saving ? 'SAVING DATA...' : 'NEXT STEP: DEPARTMENTS'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        className="p-2 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
                                        onClick={() => setCurrentStep(1)}
                                        title="Back to institution details"
                                    >
                                        <ArrowRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-bold">Departments</h2>
                                        <p className="text-gray-400 text-sm">Add branches and invite their respective HODs.</p>
                                    </div>
                                </div>
                                <button
                                    className="p-3 bg-lumina-primary/10 border border-lumina-primary/20 rounded-xl text-lumina-primary hover:bg-lumina-primary hover:text-black transition-all"
                                    onClick={() => setDepartments([...departments, { name: "", abbreviation: "", hodEmail: "", intakeStrength: "" }])}
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>
                            
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {departments.map((dept, idx) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        key={idx} 
                                        className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <input 
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-lumina-primary transition-all text-sm" 
                                                placeholder="Dept Name (e.g. Computer Science)" 
                                                value={dept.name} 
                                                onChange={e => { const next = [...departments]; next[idx].name = e.target.value; setDepartments(next); }} 
                                            />
                                            <input 
                                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-lumina-primary transition-all text-sm" 
                                                placeholder="Abbreviation (CSE)" 
                                                value={dept.abbreviation} 
                                                onChange={e => { const next = [...departments]; next[idx].abbreviation = e.target.value; setDepartments(next); }} 
                                            />
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input 
                                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-lumina-primary transition-all text-sm" 
                                                    placeholder="HOD Email Address" 
                                                    value={dept.hodEmail} 
                                                    onChange={e => { const next = [...departments]; next[idx].hodEmail = e.target.value; setDepartments(next); }} 
                                                />
                                            </div>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input 
                                                    className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl outline-none focus:border-lumina-primary transition-all text-sm" 
                                                    placeholder="Intake Strength" 
                                                    value={dept.intakeStrength} 
                                                    onChange={e => { const next = [...departments]; next[idx].intakeStrength = e.target.value; setDepartments(next); }} 
                                                />
                                            </div>
                                        </div>
                                        {departments.length > 1 && (
                                            <button 
                                                className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                                onClick={() => setDepartments(departments.filter((_, i) => i !== idx))}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            <button 
                                className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all disabled:opacity-50" 
                                onClick={saveCollegeStep2} 
                                disabled={saving}
                            >
                                {saving ? 'CREATING INFRASTRUCTURE...' : 'SAVE & CONTINUE TO ACADEMICS'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Escape hatch — always visible so users are never fully stuck */}
      <p className="mt-6 text-xs text-gray-600">
        Having trouble?{" "}
        <button
          className="text-gray-400 underline underline-offset-2 hover:text-white transition-colors"
          onClick={() => role && routeByRole(role)}
        >
          Go to dashboard
        </button>
      </p>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
