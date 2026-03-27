"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";

type Role = "super_admin" | "college_admin" | "hod" | "faculty" | "student";

type DepartmentDraft = {
  name: string;
  abbreviation: string;
  hodEmail?: string;
  intakeStrength?: string;
};

type SubjectDraft = {
  name: string;
  code: string;
  credits: string;
  semester: string;
  type: "core" | "elective" | "lab";
};

type BatchDraft = {
  year: string;
  label: string;
  sections: string;
  currentSemester: string;
};

export default function OnboardingPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role>("student");
  const [currentStep, setCurrentStep] = useState(1);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);

  // College Admin state
  const [collegeProfile, setCollegeProfile] = useState({
    collegeName: "",
    collegeCode: "",
    city: "",
    state: "",
    logoUrl: "",
    academicYear: "",
  });
  const [departments, setDepartments] = useState<DepartmentDraft[]>([
    { name: "", abbreviation: "", hodEmail: "", intakeStrength: "" },
  ]);
  const [loginPolicy, setLoginPolicy] = useState<"email_only" | "oauth_allowed" | "sso">("email_only");

  // HOD state
  const [deptProfile, setDeptProfile] = useState({
    name: "",
    abbreviation: "",
    description: "",
    intakeStrength: "",
  });
  const [subjects, setSubjects] = useState<SubjectDraft[]>([
    { name: "", code: "", credits: "", semester: "", type: "core" },
  ]);
  const [batches, setBatches] = useState<BatchDraft[]>([
    { year: "", label: "", sections: "A", currentSemester: "1" },
  ]);
  const [assignments, setAssignments] = useState<
    { subjectId: string; batchId: string; section: string; facultyId: string }[]
  >([{ subjectId: "", batchId: "", section: "", facultyId: "" }]);

  // Faculty state
  const [facultyProfile, setFacultyProfile] = useState({
    fullName: "",
    employeeId: "",
    specialization: "",
    phone: "",
  });
  const [assessmentPrefs, setAssessmentPrefs] = useState({
    gradingScale: "A:90,B:75,C:60,D:45,F:0",
    minAttendancePercent: "75",
    latePolicy: "deduct_10_per_day",
  });

  // Student state
  const [studentProfile, setStudentProfile] = useState({
    fullName: "",
    registerNumber: "",
    dob: "",
    phone: "",
    emergencyContact: "",
    parentEmail: "",
    photoUrl: "",
  });
  const [selectedElectives, setSelectedElectives] = useState<string[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);

  const totalSteps = 5;

  useEffect(() => {
    const init = async () => {
      try {
        const user = await api.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        const status = await api.getOnboardingStatus();
        setRole(status.role);
        setCollegeId(status.collegeId || user.collegeId || null);
        setDeptId(status.deptId || user.deptId || null);
        const nextStep = Math.max(1, Number(status.step || 1));
        if (nextStep >= 5) {
          routeByRole(status.role);
          return;
        }
        setCurrentStep(nextStep);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load onboarding");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  useEffect(() => {
    const loadDeptResources = async () => {
      if (!deptId) return;
      try {
        const [subjectsData, batchesData] = await Promise.all([
          api.listSubjects(deptId),
          api.listBatches(deptId),
        ]);
        setSubjectsList(subjectsData || []);
        setBatchesList(batchesData || []);
      } catch {
        // ignore for now
      }
    };
    loadDeptResources();
  }, [deptId]);

  const routeByRole = (r: Role) => {
    const routes: Record<Role, string> = {
      super_admin: "/admin",
      college_admin: "/college",
      hod: "/hod",
      faculty: "/faculty",
      student: "/student/dashboard",
    };
    router.push(routes[r] || "/");
  };

  const nextStep = async () => {
    if (currentStep >= totalSteps) return;
    setCurrentStep(prev => (prev + 1) as number);
  };

  const saveCollegeStep1 = async () => {
    if (!collegeId) {
      toast.error("College ID missing");
      return;
    }
    setSaving(true);
    try {
      await api.updateCollege(collegeId, {
        institution_name: collegeProfile.collegeName,
        code: collegeProfile.collegeCode,
        city: collegeProfile.city,
        state: collegeProfile.state,
        logo_url: collegeProfile.logoUrl,
        academic_year: collegeProfile.academicYear,
      });
      await api.updateOnboardingStep(1, collegeProfile);
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save college profile");
    } finally {
      setSaving(false);
    }
  };

  const saveCollegeStep2 = async () => {
    if (!collegeId) {
      toast.error("College ID missing");
      return;
    }
    setSaving(true);
    try {
      const created: any[] = [];
      for (const dept of departments) {
        if (!dept.name || !dept.abbreviation) continue;
        const deptRes = await api.createDepartment(collegeId, {
          name: dept.name,
          abbreviation: dept.abbreviation,
          intake_strength: dept.intakeStrength ? Number(dept.intakeStrength) : undefined,
        });
        created.push(deptRes);
        if (dept.hodEmail) {
          await api.inviteUser(collegeId, {
            email: dept.hodEmail,
            role: "hod",
            deptId: deptRes.id,
          });
        }
      }
      await api.updateOnboardingStep(2, { departments: created });
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create departments");
    } finally {
      setSaving(false);
    }
  };

  const saveCollegeStep3 = async () => {
    if (!collegeId) {
      toast.error("College ID missing");
      return;
    }
    setSaving(true);
    try {
      await api.updateCollege(collegeId, {
        academic_year: collegeProfile.academicYear,
      });
      await api.updateOnboardingStep(3, { academicYear: collegeProfile.academicYear });
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save academic calendar");
    } finally {
      setSaving(false);
    }
  };

  const saveCollegeStep4 = async () => {
    setSaving(true);
    try {
      await api.updateOnboardingStep(4, { note: "Skipped optional enrollment upload" });
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save step");
    } finally {
      setSaving(false);
    }
  };

  const saveCollegeStep5 = async () => {
    if (!collegeId) {
      toast.error("College ID missing");
      return;
    }
    setSaving(true);
    try {
      await api.updateCollege(collegeId, { login_policy: loginPolicy, is_active: true });
      await api.updateOnboardingStep(5, { loginPolicy, activateCollege: true });
      await api.completeOnboarding();
      routeByRole(role);
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate college");
    } finally {
      setSaving(false);
    }
  };

  const saveHodStep1 = async () => {
    if (!deptId) {
      toast.error("Department ID missing");
      return;
    }
    setSaving(true);
    try {
      await api.updateDepartment(deptId, {
        department_name: deptProfile.name,
        abbreviation: deptProfile.abbreviation,
        description: deptProfile.description,
        intake_strength: deptProfile.intakeStrength ? Number(deptProfile.intakeStrength) : undefined,
      });
      await api.updateOnboardingStep(1, deptProfile);
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update department profile");
    } finally {
      setSaving(false);
    }
  };

  const saveHodStep2 = async () => {
    if (!deptId) {
      toast.error("Department ID missing");
      return;
    }
    setSaving(true);
    try {
      for (const subj of subjects) {
        if (!subj.name || !subj.code) continue;
        await api.createSubject(deptId, {
          name: subj.name,
          code: subj.code,
          credits: subj.credits ? Number(subj.credits) : 3,
          semester: subj.semester ? Number(subj.semester) : 1,
          type: subj.type,
        });
      }
      await api.updateOnboardingStep(2, { subjects });
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create subjects");
    } finally {
      setSaving(false);
    }
  };

  const saveHodStep3 = async () => {
    if (!deptId) {
      toast.error("Department ID missing");
      return;
    }
    setSaving(true);
    try {
      for (const batch of batches) {
        if (!batch.year || !batch.label) continue;
        await api.createBatch(deptId, {
          year: Number(batch.year),
          label: batch.label,
          sections: batch.sections.split(",").map(s => s.trim()).filter(Boolean),
          current_semester: Number(batch.currentSemester || 1),
        });
      }
      await api.updateOnboardingStep(3, { batches });
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create batches");
    } finally {
      setSaving(false);
    }
  };

  const saveHodStep4 = async () => {
    setSaving(true);
    try {
      for (const assignment of assignments) {
        if (!assignment.subjectId || !assignment.batchId || !assignment.facultyId) continue;
        await api.assignSubject(assignment.subjectId, {
          faculty_id: assignment.facultyId,
          batch_id: assignment.batchId,
          section: assignment.section || undefined,
          academic_year: collegeProfile.academicYear || undefined,
        });
      }
      await api.updateOnboardingStep(4, { assignments });
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to assign faculty");
    } finally {
      setSaving(false);
    }
  };

  const saveHodStep5 = async () => {
    setSaving(true);
    try {
      for (const batch of batchesList) {
        const sections = batch.sections || [];
        for (const section of sections) {
          await api.createEnrollmentCode(batch.id, { section });
        }
      }
      await api.updateOnboardingStep(5, { publish: true });
      await api.completeOnboarding();
      routeByRole(role);
    } catch (err: any) {
      toast.error(err?.message || "Failed to publish department");
    } finally {
      setSaving(false);
    }
  };

  const saveFacultyStep = async (step: number) => {
    setSaving(true);
    try {
      if (step === 1) {
        await api.updateOnboardingStep(step, facultyProfile);
      } else if (step === 2) {
        await api.updateOnboardingStep(step, { confirmedAssignments: true });
      } else if (step === 3) {
        await api.updateOnboardingStep(step, { materialsUploaded: true });
      } else if (step === 4) {
        await api.updateOnboardingStep(step, assessmentPrefs);
      } else if (step === 5) {
        await api.completeOnboarding();
        routeByRole(role);
        return;
      }
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save step");
    } finally {
      setSaving(false);
    }
  };

  const saveStudentStep = async (step: number) => {
    setSaving(true);
    try {
      if (step === 1) {
        await api.updateOnboardingStep(step, studentProfile);
      } else if (step === 2) {
        await api.updateOnboardingStep(step, { confirmBatch: true });
      } else if (step === 3) {
        await api.updateOnboardingStep(step, { selectedElectives });
      } else if (step === 4) {
        await api.updateOnboardingStep(step, {
          profilePhotoUrl: studentProfile.photoUrl,
          emergencyContact: studentProfile.emergencyContact,
          parentEmail: studentProfile.parentEmail,
        });
      } else if (step === 5) {
        await api.completeOnboarding();
        routeByRole(role);
        return;
      }
      await nextStep();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save step");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading onboarding...
      </div>
    );
  }

  const renderStepContent = () => {
    if (role === "college_admin") {
      if (currentStep === 1) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">College Profile</h2>
            <input className="input" placeholder="College name" value={collegeProfile.collegeName} onChange={e => setCollegeProfile({ ...collegeProfile, collegeName: e.target.value })} />
            <input className="input" placeholder="College code" value={collegeProfile.collegeCode} onChange={e => setCollegeProfile({ ...collegeProfile, collegeCode: e.target.value })} />
            <input className="input" placeholder="City" value={collegeProfile.city} onChange={e => setCollegeProfile({ ...collegeProfile, city: e.target.value })} />
            <input className="input" placeholder="State" value={collegeProfile.state} onChange={e => setCollegeProfile({ ...collegeProfile, state: e.target.value })} />
            <input className="input" placeholder="Logo URL" value={collegeProfile.logoUrl} onChange={e => setCollegeProfile({ ...collegeProfile, logoUrl: e.target.value })} />
            <input className="input" placeholder="Academic Year (e.g. 2024-25)" value={collegeProfile.academicYear} onChange={e => setCollegeProfile({ ...collegeProfile, academicYear: e.target.value })} />
            <button className="btn" onClick={saveCollegeStep1} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 2) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Departments</h2>
            {departments.map((dept, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-2">
                <input className="input" placeholder="Department name" value={dept.name} onChange={e => {
                  const next = [...departments]; next[idx].name = e.target.value; setDepartments(next);
                }} />
                <input className="input" placeholder="Abbreviation" value={dept.abbreviation} onChange={e => {
                  const next = [...departments]; next[idx].abbreviation = e.target.value; setDepartments(next);
                }} />
                <input className="input" placeholder="HOD email (optional)" value={dept.hodEmail} onChange={e => {
                  const next = [...departments]; next[idx].hodEmail = e.target.value; setDepartments(next);
                }} />
                <input className="input" placeholder="Intake strength" value={dept.intakeStrength} onChange={e => {
                  const next = [...departments]; next[idx].intakeStrength = e.target.value; setDepartments(next);
                }} />
              </div>
            ))}
            <button className="btn-secondary" onClick={() => setDepartments([...departments, { name: "", abbreviation: "", hodEmail: "", intakeStrength: "" }])}>Add Department</button>
            <button className="btn" onClick={saveCollegeStep2} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 3) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Academic Calendar</h2>
            <input className="input" placeholder="Academic Year (2024-25)" value={collegeProfile.academicYear} onChange={e => setCollegeProfile({ ...collegeProfile, academicYear: e.target.value })} />
            <button className="btn" onClick={saveCollegeStep3} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 4) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Users & Enrollment</h2>
            <p className="text-sm text-gray-400">You can invite faculty later from the Users tab.</p>
            <button className="btn" onClick={saveCollegeStep4} disabled={saving}>Continue</button>
          </div>
        );
      }
      if (currentStep === 5) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Activate College</h2>
            <select className="input" value={loginPolicy} onChange={e => setLoginPolicy(e.target.value as any)}>
              <option value="email_only">Email only</option>
              <option value="oauth_allowed">OAuth allowed</option>
              <option value="sso">SSO</option>
            </select>
            <button className="btn" onClick={saveCollegeStep5} disabled={saving}>Activate & Finish</button>
          </div>
        );
      }
    }

    if (role === "hod") {
      if (currentStep === 1) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Department Profile</h2>
            <input className="input" placeholder="Department name" value={deptProfile.name} onChange={e => setDeptProfile({ ...deptProfile, name: e.target.value })} />
            <input className="input" placeholder="Abbreviation" value={deptProfile.abbreviation} onChange={e => setDeptProfile({ ...deptProfile, abbreviation: e.target.value })} />
            <input className="input" placeholder="Intake strength" value={deptProfile.intakeStrength} onChange={e => setDeptProfile({ ...deptProfile, intakeStrength: e.target.value })} />
            <textarea className="input" placeholder="Description" value={deptProfile.description} onChange={e => setDeptProfile({ ...deptProfile, description: e.target.value })} />
            <button className="btn" onClick={saveHodStep1} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 2) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Subjects & Syllabus</h2>
            {subjects.map((subj, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-2">
                <input className="input" placeholder="Subject name" value={subj.name} onChange={e => {
                  const next = [...subjects]; next[idx].name = e.target.value; setSubjects(next);
                }} />
                <input className="input" placeholder="Subject code" value={subj.code} onChange={e => {
                  const next = [...subjects]; next[idx].code = e.target.value; setSubjects(next);
                }} />
                <input className="input" placeholder="Credits" value={subj.credits} onChange={e => {
                  const next = [...subjects]; next[idx].credits = e.target.value; setSubjects(next);
                }} />
                <input className="input" placeholder="Semester" value={subj.semester} onChange={e => {
                  const next = [...subjects]; next[idx].semester = e.target.value; setSubjects(next);
                }} />
                <select className="input" value={subj.type} onChange={e => {
                  const next = [...subjects]; next[idx].type = e.target.value as any; setSubjects(next);
                }}>
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
            ))}
            <button className="btn-secondary" onClick={() => setSubjects([...subjects, { name: "", code: "", credits: "", semester: "", type: "core" }])}>Add Subject</button>
            <button className="btn" onClick={saveHodStep2} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 3) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Batches & Sections</h2>
            {batches.map((batch, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-2">
                <input className="input" placeholder="Admission year (e.g. 2023)" value={batch.year} onChange={e => {
                  const next = [...batches]; next[idx].year = e.target.value; setBatches(next);
                }} />
                <input className="input" placeholder="Batch label (2023-27)" value={batch.label} onChange={e => {
                  const next = [...batches]; next[idx].label = e.target.value; setBatches(next);
                }} />
                <input className="input" placeholder="Sections (A,B,C)" value={batch.sections} onChange={e => {
                  const next = [...batches]; next[idx].sections = e.target.value; setBatches(next);
                }} />
                <input className="input" placeholder="Current semester" value={batch.currentSemester} onChange={e => {
                  const next = [...batches]; next[idx].currentSemester = e.target.value; setBatches(next);
                }} />
              </div>
            ))}
            <button className="btn-secondary" onClick={() => setBatches([...batches, { year: "", label: "", sections: "A", currentSemester: "1" }])}>Add Batch</button>
            <button className="btn" onClick={saveHodStep3} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 4) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Faculty Assignments</h2>
            {assignments.map((assignment, idx) => (
              <div key={idx} className="grid gap-2 md:grid-cols-2">
                <select className="input" value={assignment.subjectId} onChange={e => {
                  const next = [...assignments]; next[idx].subjectId = e.target.value; setAssignments(next);
                }}>
                  <option value="">Select subject</option>
                  {subjectsList.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.course_name || subject.name}</option>
                  ))}
                </select>
                <select className="input" value={assignment.batchId} onChange={e => {
                  const next = [...assignments]; next[idx].batchId = e.target.value; setAssignments(next);
                }}>
                  <option value="">Select batch</option>
                  {batchesList.map(batch => (
                    <option key={batch.id} value={batch.id}>{batch.label || batch.year}</option>
                  ))}
                </select>
                <input className="input" placeholder="Section" value={assignment.section} onChange={e => {
                  const next = [...assignments]; next[idx].section = e.target.value; setAssignments(next);
                }} />
                <input className="input" placeholder="Faculty ID" value={assignment.facultyId} onChange={e => {
                  const next = [...assignments]; next[idx].facultyId = e.target.value; setAssignments(next);
                }} />
              </div>
            ))}
            <button className="btn-secondary" onClick={() => setAssignments([...assignments, { subjectId: "", batchId: "", section: "", facultyId: "" }])}>Add Assignment</button>
            <button className="btn" onClick={saveHodStep4} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 5) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Publish Department</h2>
            <p className="text-sm text-gray-400">Enrollment codes will be generated for each batch and section.</p>
            <button className="btn" onClick={saveHodStep5} disabled={saving}>Publish & Finish</button>
          </div>
        );
      }
    }

    if (role === "faculty") {
      if (currentStep === 1) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Profile</h2>
            <input className="input" placeholder="Full name" value={facultyProfile.fullName} onChange={e => setFacultyProfile({ ...facultyProfile, fullName: e.target.value })} />
            <input className="input" placeholder="Employee ID" value={facultyProfile.employeeId} onChange={e => setFacultyProfile({ ...facultyProfile, employeeId: e.target.value })} />
            <input className="input" placeholder="Specialization" value={facultyProfile.specialization} onChange={e => setFacultyProfile({ ...facultyProfile, specialization: e.target.value })} />
            <input className="input" placeholder="Phone" value={facultyProfile.phone} onChange={e => setFacultyProfile({ ...facultyProfile, phone: e.target.value })} />
            <button className="btn" onClick={() => saveFacultyStep(1)} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 2) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Confirm Assignments</h2>
            <p className="text-sm text-gray-400">Review the assignments on your dashboard after onboarding.</p>
            <button className="btn" onClick={() => saveFacultyStep(2)} disabled={saving}>Confirm & Continue</button>
          </div>
        );
      }
      if (currentStep === 3) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Course Materials</h2>
            <p className="text-sm text-gray-400">You can upload materials after onboarding.</p>
            <button className="btn" onClick={() => saveFacultyStep(3)} disabled={saving}>Continue</button>
          </div>
        );
      }
      if (currentStep === 4) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Assessment Preferences</h2>
            <input className="input" placeholder="Grading scale" value={assessmentPrefs.gradingScale} onChange={e => setAssessmentPrefs({ ...assessmentPrefs, gradingScale: e.target.value })} />
            <input className="input" placeholder="Min attendance %" value={assessmentPrefs.minAttendancePercent} onChange={e => setAssessmentPrefs({ ...assessmentPrefs, minAttendancePercent: e.target.value })} />
            <input className="input" placeholder="Late policy" value={assessmentPrefs.latePolicy} onChange={e => setAssessmentPrefs({ ...assessmentPrefs, latePolicy: e.target.value })} />
            <button className="btn" onClick={() => saveFacultyStep(4)} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 5) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Finish</h2>
            <button className="btn" onClick={() => saveFacultyStep(5)} disabled={saving}>Complete Onboarding</button>
          </div>
        );
      }
    }

    if (role === "student") {
      if (currentStep === 1) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Personal Details</h2>
            <input className="input" placeholder="Full name" value={studentProfile.fullName} onChange={e => setStudentProfile({ ...studentProfile, fullName: e.target.value })} />
            <input className="input" placeholder="Register number" value={studentProfile.registerNumber} onChange={e => setStudentProfile({ ...studentProfile, registerNumber: e.target.value })} />
            <input className="input" placeholder="DOB (YYYY-MM-DD)" value={studentProfile.dob} onChange={e => setStudentProfile({ ...studentProfile, dob: e.target.value })} />
            <input className="input" placeholder="Phone" value={studentProfile.phone} onChange={e => setStudentProfile({ ...studentProfile, phone: e.target.value })} />
            <button className="btn" onClick={() => saveStudentStep(1)} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 2) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Confirm Batch</h2>
            <p className="text-sm text-gray-400">Your batch/section is pre-assigned by the college.</p>
            <button className="btn" onClick={() => saveStudentStep(2)} disabled={saving}>Confirm & Continue</button>
          </div>
        );
      }
      if (currentStep === 3) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Electives</h2>
            <div className="grid gap-2">
              {subjectsList.map(subject => (
                <label key={subject.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedElectives.includes(subject.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedElectives(prev => [...prev, subject.id]);
                      } else {
                        setSelectedElectives(prev => prev.filter(id => id !== subject.id));
                      }
                    }}
                  />
                  {subject.course_name || subject.name}
                </label>
              ))}
            </div>
            <button className="btn" onClick={() => saveStudentStep(3)} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 4) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Profile Photo</h2>
            <input className="input" placeholder="Photo URL" value={studentProfile.photoUrl} onChange={e => setStudentProfile({ ...studentProfile, photoUrl: e.target.value })} />
            <input className="input" placeholder="Emergency contact" value={studentProfile.emergencyContact} onChange={e => setStudentProfile({ ...studentProfile, emergencyContact: e.target.value })} />
            <input className="input" placeholder="Parent email" value={studentProfile.parentEmail} onChange={e => setStudentProfile({ ...studentProfile, parentEmail: e.target.value })} />
            <button className="btn" onClick={() => saveStudentStep(4)} disabled={saving}>Save & Continue</button>
          </div>
        );
      }
      if (currentStep === 5) {
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Finish</h2>
            <button className="btn" onClick={() => saveStudentStep(5)} disabled={saving}>Complete Onboarding</button>
          </div>
        );
      }
    }

    return <div>Unsupported role.</div>;
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Onboarding</h1>
            <p className="text-sm text-gray-400">Step {currentStep} of {totalSteps}</p>
          </div>
          <div className="text-sm text-gray-400 capitalize">{role.replace("_", " ")}</div>
        </div>
        <div className="space-y-6">
          {renderStepContent()}
        </div>
      </div>
      <style jsx>{`
        .input {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
        }
        .btn {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          background: #3b82f6;
          font-weight: 600;
        }
        .btn-secondary {
          width: 100%;
          padding: 0.6rem 1rem;
          border-radius: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
