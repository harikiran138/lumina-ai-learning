"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  validateOptionalEmail,
  validateOptionalPhone,
  validateRequiredName,
} from "@/lib/onboarding-validation";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Circle,
  Plus,
  Shield,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

type AssignmentDraft = {
  subjectId: string;
  batchId: string;
  section: string;
  facultyId: string;
};

const ROLE_ROUTES: Record<Role, string> = {
  super_admin: "/admin",
  college_admin: "/college",
  hod: "/hod/dashboard",
  faculty: "/faculty/dashboard",
  student: "/student/dashboard",
};

const STEP_ICONS: Record<number, any> = {
  1: UserCircle,
  2: Building2,
  3: BookOpen,
  4: Users,
  5: Shield,
};

const baseInputClass =
  "w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl outline-none focus:border-lumina-primary focus:ring-2 focus:ring-lumina-primary/10 transition-all text-white placeholder:text-gray-600 shadow-inner";
const primaryButtonClass =
  "w-full py-5 bg-lumina-primary text-black font-black rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.01] transition-all shadow-[0_10px_40px_rgba(250,204,21,0.25)] disabled:opacity-50 uppercase tracking-wider";
const secondaryButtonClass =
  "w-full py-5 bg-white/5 border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all disabled:opacity-50 uppercase tracking-wider";

const parseSections = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const stringifySections = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
};

const makeEmptyDepartment = (): DepartmentDraft => ({
  name: "",
  abbreviation: "",
  hodEmail: "",
  intakeStrength: "",
});

const makeEmptySubject = (): SubjectDraft => ({
  name: "",
  code: "",
  credits: "3",
  semester: "1",
  type: "core",
});

const makeEmptyBatch = (): BatchDraft => {
  const year = new Date().getFullYear();
  return {
    year: String(year),
    label: `${year}-${year + 4}`,
    sections: "A, B",
    currentSemester: "1",
  };
};

const makeEmptyAssignment = (): AssignmentDraft => ({
  subjectId: "",
  batchId: "",
  section: "",
  facultyId: "",
});

const STUDENT_LEARNING_STYLE_OPTIONS = [
  { value: "story_based", label: "Story-based" },
  { value: "real_world_examples", label: "Real-world examples" },
  { value: "step_by_step", label: "Step-by-step explanation" },
  { value: "visual_diagrams", label: "Visual and diagrams" },
  { value: "formula_focused", label: "Formula-focused" },
];

const STUDENT_GOAL_OPTIONS = [
  { value: "pass_semester_exams", label: "Pass semester exams" },
  { value: "score_above_90", label: "Score above 90%" },
  { value: "placement_preparation", label: "Prepare for placements or competitive exams" },
  { value: "improve_weak_subjects", label: "Improve weak engineering subjects" },
];

const FACULTY_TEACHING_STYLE_OPTIONS = [
  { value: "concept_first", label: "Concept-first delivery" },
  { value: "problem_solving", label: "Problem-solving sessions" },
  { value: "visual_diagrams", label: "Visual and board derivations" },
  { value: "lab_demonstration", label: "Lab and demo-driven teaching" },
  { value: "industry_examples", label: "Industry and real-world examples" },
];

const FACULTY_GOAL_OPTIONS = [
  { value: "strengthen_fundamentals", label: "Strengthen engineering fundamentals" },
  { value: "improve_pass_rate", label: "Improve pass percentage and outcomes" },
  { value: "placement_readiness", label: "Build placement and interview readiness" },
  { value: "practical_mastery", label: "Improve practical and lab mastery" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const saveSnapshot = useOnboardingStore((state) => state.saveSnapshot);
  const clearSnapshot = useOnboardingStore((state) => state.clearSnapshot);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [role, setRole] = useState<Role>("student");
  const [currentStep, setCurrentStep] = useState(1);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [deptId, setDeptId] = useState<string | null>(null);
  const [batchId, setBatchId] = useState<string | null>(null);

  const [collegeProfile, setCollegeProfile] = useState({
    collegeName: "",
    collegeCode: "",
    city: "",
    state: "",
    logoUrl: "",
    academicYear: "",
  });
  const [departments, setDepartments] = useState<DepartmentDraft[]>([makeEmptyDepartment()]);
  const [loginPolicy, setLoginPolicy] = useState<"email_only" | "oauth_allowed" | "sso">("email_only");
  const [activateCollege, setActivateCollege] = useState(true);

  const [deptProfile, setDeptProfile] = useState({
    name: "",
    abbreviation: "",
    description: "",
    intakeStrength: "",
  });
  const [subjects, setSubjects] = useState<SubjectDraft[]>([makeEmptySubject()]);
  const [batches, setBatches] = useState<BatchDraft[]>([makeEmptyBatch()]);
  const [assignments, setAssignments] = useState<AssignmentDraft[]>([makeEmptyAssignment()]);

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
  const [facultyTeachingStyles, setFacultyTeachingStyles] = useState<string[]>([]);
  const [facultySubjectConfidence, setFacultySubjectConfidence] = useState<Record<string, number>>({});
  const [facultyGoal, setFacultyGoal] = useState("strengthen_fundamentals");
  const [facultyDeviceType, setFacultyDeviceType] = useState("laptop");
  const [facultyInternetType, setFacultyInternetType] = useState("stable");
  const [facultyConsents, setFacultyConsents] = useState({
    teacherVerifiedAi: false,
    academicIntegrity: false,
    dataPolicy: false,
  });

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
  const [confirmBatch, setConfirmBatch] = useState(true);
  const [correctionMessage, setCorrectionMessage] = useState("");
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [studentBatchInfo, setStudentBatchInfo] = useState<any | null>(null);
  const [studentIssues, setStudentIssues] = useState<Record<string, boolean>>({});
  const [studentClassId, setStudentClassId] = useState("");
  const [learningStyles, setLearningStyles] = useState<string[]>([]);
  const [skillLevels, setSkillLevels] = useState<Record<string, number>>({});
  const [studentGoal, setStudentGoal] = useState("improve_weak_subjects");
  const [deviceType, setDeviceType] = useState("both");
  const [internetType, setInternetType] = useState("stable");
  const [consents, setConsents] = useState({
    teacherVerifiedAi: false,
    academicIntegrity: false,
    dataPolicy: false,
  });

  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [batchesList, setBatchesList] = useState<any[]>([]);
  const [facultyUsers, setFacultyUsers] = useState<any[]>([]);
  const [facultyAssignments, setFacultyAssignments] = useState<any[]>([]);
  const [confirmedAssignmentIds, setConfirmedAssignmentIds] = useState<string[]>([]);

  const totalSteps = 5;
  const isCollegeRole = role === "college_admin" || role === "super_admin";
  const StepIcon = STEP_ICONS[currentStep] || UserCircle;

  const currentBatch = useMemo(
    () => batchesList.find((item) => item.id === batchId) || null,
    [batchesList, batchId],
  );
  const resolvedStudentBatch = useMemo(() => studentBatchInfo || currentBatch || null, [studentBatchInfo, currentBatch]);
  const activeStudentSubjects = useMemo(() => {
    const selectedIds = selectedElectives.length ? new Set(selectedElectives) : null;
    return (subjectsList || []).filter((subject) => !selectedIds || selectedIds.has(subject.id));
  }, [subjectsList, selectedElectives]);
  const activeFacultyAssignments = useMemo(() => {
    if (!facultyAssignments.length) {
      return [];
    }
    const activeIds = new Set(
      (confirmedAssignmentIds.length
        ? confirmedAssignmentIds
        : facultyAssignments.map((row: any) => row.assignment?.id).filter(Boolean)) as string[],
    );
    return facultyAssignments.filter((row: any) => activeIds.has(row.assignment?.id));
  }, [facultyAssignments, confirmedAssignmentIds]);

  useEffect(() => {
    const init = async () => {
      try {
        const user = await api.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }

        const status = await api.getOnboardingStatus();
        const normalizedRole = status.role as Role;
        const snapshot = useOnboardingStore.getState().snapshots[normalizedRole] || {};
        const progress = status.progress || {};
        const step1 = progress.step_1 || {};
        const step2 = progress.step_2 || {};
        const step3 = progress.step_3 || {};
        const step4 = progress.step_4 || {};
        const step5 = progress.step_5 || {};

        setRole(normalizedRole);
        setCollegeId(status.collegeId || user.collegeId || null);
        setDeptId(status.deptId || user.deptId || null);
        setBatchId(status.batchId || user.batchId || null);

        if (normalizedRole === "student") {
          setStudentProfile((prev) => ({
            ...prev,
            fullName: step1.fullName || snapshot.studentProfile?.fullName || user.name || "",
            registerNumber: step1.registerNumber || snapshot.studentProfile?.registerNumber || "",
            dob: step1.dob || snapshot.studentProfile?.dob || "",
            phone: step4.phone || step1.phone || snapshot.studentProfile?.phone || "",
            emergencyContact: step4.emergencyContact || snapshot.studentProfile?.emergencyContact || "",
            parentEmail: step4.parentEmail || snapshot.studentProfile?.parentEmail || "",
            photoUrl: step4.profilePhotoUrl || step4.photoUrl || snapshot.studentProfile?.photoUrl || "",
          }));
          setSelectedElectives(step3.selectedElectives || snapshot.selectedElectives || []);
          setConfirmBatch(step2.confirmBatch ?? snapshot.confirmBatch ?? true);
          setCorrectionMessage(step2.correctionMessage || snapshot.correctionMessage || "");
          setStudentClassId(step5.classId || snapshot.studentClassId || "");
          setLearningStyles(step5.learningStyles || snapshot.learningStyles || []);
          setSkillLevels(step5.skillLevels || snapshot.skillLevels || {});
          setStudentGoal(step5.goal || snapshot.studentGoal || "improve_weak_subjects");
          setDeviceType(step5.deviceType || snapshot.deviceType || "both");
          setInternetType(step5.internetType || snapshot.internetType || "stable");
          setConsents(
            step5.consents || {
              teacherVerifiedAi: false,
              academicIntegrity: false,
              dataPolicy: false,
              ...(snapshot.consents || {}),
            },
          );
        }

        if (normalizedRole === "faculty") {
          setFacultyProfile((prev) => ({
            ...prev,
            fullName: step1.fullName || snapshot.facultyProfile?.fullName || user.name || "",
            employeeId: step1.employeeId || snapshot.facultyProfile?.employeeId || "",
            specialization: step3.specialization || snapshot.facultyProfile?.specialization || "",
            phone: step1.phone || step3.phone || snapshot.facultyProfile?.phone || "",
          }));
          setAssessmentPrefs((prev) => ({
            ...prev,
            gradingScale: step4.gradingScale || snapshot.assessmentPrefs?.gradingScale || prev.gradingScale,
            minAttendancePercent: step4.minAttendancePercent || snapshot.assessmentPrefs?.minAttendancePercent || prev.minAttendancePercent,
            latePolicy: step4.latePolicy || snapshot.assessmentPrefs?.latePolicy || prev.latePolicy,
          }));
          setConfirmedAssignmentIds(step5.confirmedAssignmentIds || step2.confirmedAssignmentIds || snapshot.confirmedAssignmentIds || []);
          setFacultyTeachingStyles(step5.teachingStyles || snapshot.facultyTeachingStyles || []);
          setFacultySubjectConfidence(step5.subjectConfidence || snapshot.facultySubjectConfidence || {});
          setFacultyGoal(step5.goal || snapshot.facultyGoal || "strengthen_fundamentals");
          setFacultyDeviceType(step5.deviceType || snapshot.facultyDeviceType || "laptop");
          setFacultyInternetType(step5.internetType || snapshot.facultyInternetType || "stable");
          setFacultyConsents(
            step5.consents || {
              teacherVerifiedAi: false,
              academicIntegrity: false,
              dataPolicy: false,
              ...(snapshot.facultyConsents || {}),
            },
          );
        }

        if (normalizedRole === "hod") {
          setDeptProfile((prev) => ({
            ...prev,
            name: step1.name || snapshot.deptProfile?.name || prev.name,
            abbreviation: step1.abbreviation || snapshot.deptProfile?.abbreviation || prev.abbreviation,
            description: step1.description || snapshot.deptProfile?.description || "",
            intakeStrength: step1.intakeStrength || snapshot.deptProfile?.intakeStrength || "",
          }));
          setSubjects(step2.subjects?.length ? step2.subjects : snapshot.subjects?.length ? snapshot.subjects : [makeEmptySubject()]);
          setBatches(step3.batches?.length ? step3.batches.map((batch: any) => ({
            year: String(batch.year || ""),
            label: batch.label || "",
            sections: stringifySections(batch.sections),
            currentSemester: String(batch.current_semester || batch.currentSemester || "1"),
          })) : snapshot.batches?.length ? snapshot.batches : [makeEmptyBatch()]);
          setAssignments(step4.assignments?.length ? step4.assignments : snapshot.assignments?.length ? snapshot.assignments : [makeEmptyAssignment()]);
        }

        if (normalizedRole === "college_admin" || normalizedRole === "super_admin") {
          setCollegeProfile((prev) => ({
            ...prev,
            collegeName: step1.collegeName || snapshot.collegeProfile?.collegeName || prev.collegeName,
            collegeCode: step1.collegeCode || snapshot.collegeProfile?.collegeCode || prev.collegeCode,
            city: step3.city || snapshot.collegeProfile?.city || prev.city,
            state: step3.state || snapshot.collegeProfile?.state || prev.state,
            logoUrl: step3.logoUrl || snapshot.collegeProfile?.logoUrl || prev.logoUrl,
            academicYear: step3.academicYear || snapshot.collegeProfile?.academicYear || prev.academicYear,
          }));
          setDepartments(step2.departments?.length ? step2.departments.map((dept: any) => ({
            name: dept.name || dept.department_name || "",
            abbreviation: dept.abbreviation || "",
            hodEmail: dept.hodEmail || "",
            intakeStrength: dept.intakeStrength ? String(dept.intakeStrength) : "",
          })) : snapshot.departments?.length ? snapshot.departments : [makeEmptyDepartment()]);
          if (step4.loginPolicy) {
            setLoginPolicy(step4.loginPolicy);
          } else if (snapshot.loginPolicy) {
            setLoginPolicy(snapshot.loginPolicy);
          }
          setActivateCollege(step4.activateCollege ?? snapshot.activateCollege ?? true);
        }

        const nextStep = Math.max(1, Number(status.step || snapshot.currentStep || 1));
        if (nextStep >= 5) {
          await api.refreshSession().catch(() => undefined);
          clearSnapshot(normalizedRole);
          router.push(ROLE_ROUTES[normalizedRole] || "/");
          return;
        }
        setCurrentStep(nextStep);
      } catch (err: any) {
        const message = err?.message || "Failed to load onboarding";
        if (/token|credential|session|401|authorization|expired/i.test(message)) {
          router.push("/login?reason=session_expired");
          return;
        }
        setPageError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, clearSnapshot]);

  useEffect(() => {
    const loadDepartmentResources = async () => {
      if (!deptId) {
        setSubjectsList([]);
        setBatchesList([]);
        return;
      }
      try {
        const [subjectRows, batchRows] = await Promise.all([
          role === "student" ? api.getOnboardingSubjects() : api.listSubjects(deptId),
          api.listBatches(deptId),
        ]);
        setSubjectsList(subjectRows || []);
        setBatchesList(batchRows || []);
      } catch (err: any) {
        toast.error(err?.message || "Failed to load department resources");
      }
    };

    loadDepartmentResources();
  }, [deptId, role]);

  useEffect(() => {
    const loadFacultyUsers = async () => {
      if (role !== "hod" || !collegeId) {
        setFacultyUsers([]);
        return;
      }
      try {
        const users = await api.listCollegeUsers(collegeId, { deptId: deptId || undefined });
        setFacultyUsers(
          (users || []).filter((user: any) => ["faculty", "teacher", "hod"].includes(user.role)),
        );
      } catch (err: any) {
        toast.error(err?.message || "Failed to load faculty roster");
      }
    };

    loadFacultyUsers();
  }, [role, collegeId, deptId]);

  useEffect(() => {
    const loadFacultyOnboardingOptions = async () => {
      if (role !== "faculty") {
        setFacultyAssignments([]);
        return;
      }
      try {
        const options = await api.getFacultyOnboardingOptions();
        const assignmentRows = options?.assignments || [];
        const step5 = options?.step5 || {};

        setFacultyAssignments(assignmentRows);
        setConfirmedAssignmentIds((prev) =>
          prev.length
            ? prev
            : (step5.confirmedAssignmentIds || assignmentRows.map((row: any) => row.assignment?.id).filter(Boolean)),
        );
        setFacultyTeachingStyles((prev) => (prev.length ? prev : step5.teachingStyles || []));
        setFacultySubjectConfidence((prev) => ({ ...(step5.subjectConfidence || {}), ...prev }));
        setFacultyGoal((prev) => (prev !== "strengthen_fundamentals" ? prev : step5.goal || prev));
        setFacultyDeviceType((prev) => (prev !== "laptop" ? prev : step5.deviceType || prev));
        setFacultyInternetType((prev) => (prev !== "stable" ? prev : step5.internetType || prev));
        setFacultyConsents((prev) =>
          prev.teacherVerifiedAi || prev.academicIntegrity || prev.dataPolicy
            ? prev
            : step5.consents || prev,
        );
      } catch (err: any) {
        toast.error(err?.message || "Failed to load faculty onboarding setup");
      }
    };

    loadFacultyOnboardingOptions();
  }, [role]);

  useEffect(() => {
    const loadStudentStepFiveOptions = async () => {
      if (role !== "student") {
        setStudentClasses([]);
        setStudentBatchInfo(null);
        return;
      }

      try {
        const options = await api.getStudentOnboardingOptions();
        const preferences = options?.learnerProfile?.preferences || {};

        setStudentBatchInfo(options?.batch || null);
        setStudentClasses(options?.classes || []);
        setStudentIssues(options?.issues || {});
        setStudentClassId((prev) => prev || options?.enrollment?.class_id || options?.preferredClassId || "");
        setSelectedElectives((prev) => (prev.length ? prev : options?.selectedSubjectIds || []));
        setLearningStyles((prev) => (prev.length ? prev : preferences.learning_styles || []));
        setSkillLevels((prev) => ({ ...(options?.skillLevels || {}), ...prev }));
        setStudentGoal((prev) =>
          prev !== "improve_weak_subjects" ? prev : options?.learnerProfile?.goals?.[0] || prev,
        );
        setDeviceType((prev) => (prev !== "both" ? prev : preferences.device_type || prev));
        setInternetType((prev) => (prev !== "stable" ? prev : preferences.internet_type || prev));
      } catch (err: any) {
        toast.error(err?.message || "Failed to load final student setup");
      }
    };

    loadStudentStepFiveOptions();
  }, [role]);

  useEffect(() => {
    if (role !== "student") {
      return;
    }

    const relevantSubjectIds = (selectedElectives.length
      ? selectedElectives
      : (subjectsList || []).map((subject) => subject.id).filter(Boolean)) as string[];

    setSkillLevels((prev) => {
      const next = { ...prev };
      for (const subjectId of relevantSubjectIds) {
        if (typeof next[subjectId] !== "number") {
          next[subjectId] = 0.5;
        }
      }
      return next;
    });
  }, [role, selectedElectives, subjectsList]);

  useEffect(() => {
    if (role !== "faculty") {
      return;
    }

    const relevantCourseIds = activeFacultyAssignments
      .map((row: any) => row.course?.id || row.assignment?.course_id)
      .filter(Boolean) as string[];

    setFacultySubjectConfidence((prev) => {
      const next = { ...prev };
      for (const courseId of relevantCourseIds) {
        if (typeof next[courseId] !== "number") {
          next[courseId] = 0.7;
        }
      }
      return next;
    });
  }, [role, activeFacultyAssignments]);

  useEffect(() => {
    if (loading) {
      return;
    }

    saveSnapshot(role, {
      currentStep,
      collegeId,
      deptId,
      batchId,
      collegeProfile,
      departments,
      loginPolicy,
      activateCollege,
      deptProfile,
      subjects,
      batches,
      assignments,
      facultyProfile,
      assessmentPrefs,
      facultyTeachingStyles,
      facultySubjectConfidence,
      facultyGoal,
      facultyDeviceType,
      facultyInternetType,
      facultyConsents,
      studentProfile,
      selectedElectives,
      confirmBatch,
      correctionMessage,
      studentClassId,
      learningStyles,
      skillLevels,
      studentGoal,
      deviceType,
      internetType,
      consents,
      confirmedAssignmentIds,
    });
  }, [
    loading,
    saveSnapshot,
    role,
    currentStep,
    collegeId,
    deptId,
    batchId,
    collegeProfile,
    departments,
    loginPolicy,
    activateCollege,
    deptProfile,
    subjects,
    batches,
    assignments,
    facultyProfile,
    assessmentPrefs,
    facultyTeachingStyles,
    facultySubjectConfidence,
    facultyGoal,
    facultyDeviceType,
    facultyInternetType,
    facultyConsents,
    studentProfile,
    selectedElectives,
    confirmBatch,
    correctionMessage,
    studentClassId,
    learningStyles,
    skillLevels,
    studentGoal,
    deviceType,
    internetType,
    consents,
    confirmedAssignmentIds,
  ]);

  const routeByRole = (targetRole: Role) => {
    router.push(ROLE_ROUTES[targetRole] || "/");
  };

  const handleSaveStep = async (handler: () => Promise<void>) => {
    setSaving(true);
    setPageError(null);
    try {
      await handler();
    } catch (err: any) {
      const message = err?.message || "Something went wrong. Please try again.";
      setPageError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const finishOnboarding = async (finalPayload: Record<string, any>) => {
    await api.updateOnboardingStep(5, finalPayload);
    await api.completeOnboarding();
    await api.refreshSession();
    clearSnapshot(role);
    routeByRole(role);
  };

  const raiseIfInvalid = (...errors: Array<string | null>) => {
    const firstError = errors.find(Boolean);
    if (firstError) {
      throw new Error(firstError);
    }
  };

  const updateDepartmentDraft = (index: number, key: keyof DepartmentDraft, value: string) => {
    setDepartments((prev) => prev.map((dept, idx) => (idx === index ? { ...dept, [key]: value } : dept)));
  };

  const updateSubjectDraft = (index: number, key: keyof SubjectDraft, value: string) => {
    setSubjects((prev) => prev.map((subject, idx) => (idx === index ? { ...subject, [key]: value } : subject)));
  };

  const updateBatchDraft = (index: number, key: keyof BatchDraft, value: string) => {
    setBatches((prev) => prev.map((batch, idx) => (idx === index ? { ...batch, [key]: value } : batch)));
  };

  const updateAssignmentDraft = (index: number, key: keyof AssignmentDraft, value: string) => {
    setAssignments((prev) => prev.map((assignment, idx) => (idx === index ? { ...assignment, [key]: value } : assignment)));
  };

  const saveCollegeStep1 = () =>
    handleSaveStep(async () => {
      raiseIfInvalid(
        validateRequiredName(collegeProfile.collegeName, "College name"),
        collegeProfile.collegeCode.trim() ? null : "College code is required",
      );

      let activeCollegeId = collegeId;
      if (!activeCollegeId) {
        if (role !== "super_admin") {
          throw new Error("Your admin account is not linked to a college yet. Ask a super admin to assign one first.");
        }
        const createdCollege = await api.createCollege({
          institution_name: collegeProfile.collegeName,
          code: collegeProfile.collegeCode,
          city: collegeProfile.city,
          state: collegeProfile.state,
          logo_url: collegeProfile.logoUrl,
        });
        if (!createdCollege?.id) {
          throw new Error(createdCollege?.detail || "Failed to create college");
        }
        activeCollegeId = createdCollege.id;
        setCollegeId(createdCollege.id);
      } else {
        const updatedCollege = await api.updateCollege(activeCollegeId, {
          institution_name: collegeProfile.collegeName,
          code: collegeProfile.collegeCode,
        });
        if (updatedCollege?.detail) {
          throw new Error(updatedCollege.detail);
        }
      }

      await api.updateOnboardingStep(1, {
        collegeName: collegeProfile.collegeName,
        collegeCode: collegeProfile.collegeCode,
        collegeId: activeCollegeId,
      });
      goToNextStep();
    });

  const saveCollegeStep2 = () =>
    handleSaveStep(async () => {
      if (!collegeId) {
        throw new Error("College ID is missing. Refresh and try again.");
      }

      const validDepartments = departments.filter(
        (dept) => dept.name.trim() && dept.abbreviation.trim(),
      );
      if (!validDepartments.length) {
        throw new Error("Add at least one department with a name and abbreviation");
      }
      for (const dept of validDepartments) {
        raiseIfInvalid(validateOptionalEmail(dept.hodEmail || "", "HOD email"));
      }

      const createdDepartments: any[] = [];
      for (const dept of validDepartments) {
        const createdDept = await api.createDepartment(collegeId, {
          name: dept.name,
          abbreviation: dept.abbreviation,
          intake_strength: dept.intakeStrength ? Number(dept.intakeStrength) : undefined,
        });
        if (!createdDept?.id) {
          throw new Error(createdDept?.detail || `Failed to create ${dept.name}`);
        }
        createdDepartments.push(createdDept);

        if (dept.hodEmail) {
          const inviteResult = await api.inviteUser(collegeId, {
            email: dept.hodEmail,
            role: "hod",
            deptId: createdDept.id,
          });
          if (inviteResult?.detail) {
            throw new Error(inviteResult.detail);
          }
        }
      }

      await api.updateOnboardingStep(2, {
        departments: validDepartments,
      });
      goToNextStep();
    });

  const saveCollegeStep3 = () =>
    handleSaveStep(async () => {
      if (!collegeId) {
        throw new Error("College ID is missing. Refresh and try again.");
      }
      if (!collegeProfile.academicYear.trim()) {
        throw new Error("Academic year is required");
      }

      const updatedCollege = await api.updateCollege(collegeId, {
        city: collegeProfile.city,
        state: collegeProfile.state,
        logo_url: collegeProfile.logoUrl,
        academic_year: collegeProfile.academicYear,
      });
      if (updatedCollege?.detail) {
        throw new Error(updatedCollege.detail);
      }

      await api.updateOnboardingStep(3, {
        academicYear: collegeProfile.academicYear,
        city: collegeProfile.city,
        state: collegeProfile.state,
        logoUrl: collegeProfile.logoUrl,
      });
      goToNextStep();
    });

  const saveCollegeStep4 = () =>
    handleSaveStep(async () => {
      if (!collegeId) {
        throw new Error("College ID is missing. Refresh and try again.");
      }

      const updatedCollege = await api.updateCollege(collegeId, {
        login_policy: loginPolicy,
      });
      if (updatedCollege?.detail) {
        throw new Error(updatedCollege.detail);
      }

      await api.updateOnboardingStep(4, {
        loginPolicy,
        activateCollege,
      });
      goToNextStep();
    });

  const saveCollegeStep5 = () =>
    handleSaveStep(async () => {
      if (!activateCollege) {
        throw new Error("Confirm college activation to finish onboarding");
      }
      await finishOnboarding({
        activateCollege: true,
        loginPolicy,
        academicYear: collegeProfile.academicYear,
      });
    });

  const saveHodStep1 = () =>
    handleSaveStep(async () => {
      if (!deptId) {
        throw new Error("Department ID is missing. Refresh and try again.");
      }
      if (!collegeId) {
        throw new Error("College ID is missing. Refresh and try again.");
      }
      raiseIfInvalid(
        validateRequiredName(deptProfile.name, "Department name"),
        deptProfile.abbreviation.trim() ? null : "Department abbreviation is required",
      );

      const updatedDepartment = await api.architectureUpdateDepartment(collegeId, deptId, {
        department_name: deptProfile.name,
        abbreviation: deptProfile.abbreviation,
        description: deptProfile.description,
        intake_strength: deptProfile.intakeStrength ? Number(deptProfile.intakeStrength) : undefined,
      });
      if (updatedDepartment?.detail) {
        throw new Error(updatedDepartment.detail);
      }

      await api.updateOnboardingStep(1, {
        name: deptProfile.name,
        abbreviation: deptProfile.abbreviation,
        description: deptProfile.description,
        intakeStrength: deptProfile.intakeStrength,
      });
      goToNextStep();
    });

  const saveHodStep2 = () =>
    handleSaveStep(async () => {
      if (!deptId) {
        throw new Error("Department ID is missing. Refresh and try again.");
      }

      const validSubjects = subjects.filter((subject) => subject.name.trim() && subject.code.trim());
      if (!validSubjects.length) {
        throw new Error("Add at least one valid subject");
      }

      const createdSubjects: any[] = [];
      for (const subject of validSubjects) {
        const createdSubject = await api.createSubject(deptId, {
          name: subject.name,
          code: subject.code,
          credits: Number(subject.credits || 0),
          semester: Number(subject.semester || 0),
          type: subject.type,
        });
        if (!createdSubject?.id) {
          throw new Error(createdSubject?.detail || `Failed to create ${subject.name}`);
        }
        createdSubjects.push(createdSubject);
      }

      setSubjectsList((prev) => [...prev, ...createdSubjects]);
      await api.updateOnboardingStep(2, { subjects: validSubjects });
      goToNextStep();
    });

  const saveHodStep3 = () =>
    handleSaveStep(async () => {
      if (!deptId) {
        throw new Error("Department ID is missing. Refresh and try again.");
      }

      const validBatches = batches
        .map((batch) => ({
          year: batch.year.trim(),
          label: batch.label.trim(),
          sections: parseSections(batch.sections),
          currentSemester: batch.currentSemester.trim(),
        }))
        .filter((batch) => batch.year && batch.label && batch.sections.length);

      if (!validBatches.length) {
        throw new Error("Add at least one valid batch with sections");
      }

      const createdBatches: any[] = [];
      for (const batch of validBatches) {
        const createdBatch = await api.createBatch(deptId, {
          year: Number(batch.year),
          label: batch.label,
          sections: batch.sections,
          current_semester: Number(batch.currentSemester || 1),
        });
        if (!createdBatch?.id) {
          throw new Error(createdBatch?.detail || `Failed to create batch ${batch.label}`);
        }
        createdBatches.push(createdBatch);
      }

      setBatchesList((prev) => [...prev, ...createdBatches]);
      await api.updateOnboardingStep(3, { batches: validBatches });
      goToNextStep();
    });

  const saveHodStep4 = () =>
    handleSaveStep(async () => {
      const validAssignments = assignments.filter(
        (assignment) => assignment.subjectId && assignment.batchId && assignment.facultyId,
      );

      const createdAssignments: any[] = [];
      for (const assignment of validAssignments) {
        const result = await api.assignSubject(assignment.subjectId, {
          faculty_id: assignment.facultyId,
          batch_id: assignment.batchId,
          section: assignment.section || undefined,
          academic_year: collegeProfile.academicYear || undefined,
        });
        if (result?.detail) {
          throw new Error(result.detail);
        }
        createdAssignments.push(assignment);
      }

      await api.updateOnboardingStep(4, { assignments: createdAssignments });
      goToNextStep();
    });

  const saveHodStep5 = () =>
    handleSaveStep(async () => {
      await finishOnboarding({ ready: true });
    });

  const saveFacultyStep1 = () =>
    handleSaveStep(async () => {
      raiseIfInvalid(
        validateRequiredName(facultyProfile.fullName, "Full name"),
        validateOptionalPhone(facultyProfile.phone, "Faculty phone number"),
        facultyProfile.employeeId.trim() ? null : "Employee ID is required",
      );

      goToNextStep();
      await api.updateOnboardingStep(1, {
        fullName: facultyProfile.fullName,
        employeeId: facultyProfile.employeeId,
        phone: facultyProfile.phone,
      });
    });

  const saveFacultyStep2 = () =>
    handleSaveStep(async () => {
      if (facultyAssignments.length && !confirmedAssignmentIds.length) {
        throw new Error("Confirm at least one linked engineering assignment");
      }
      goToNextStep();
      await api.updateOnboardingStep(2, {
        confirmedAssignments: true,
        confirmedAssignmentIds,
      });
    });

  const saveFacultyStep3 = () =>
    handleSaveStep(async () => {
      goToNextStep();
      await api.updateOnboardingStep(3, {
        specialization: facultyProfile.specialization,
        phone: facultyProfile.phone,
      });
    });

  const saveFacultyStep4 = () =>
    handleSaveStep(async () => {
      if (!assessmentPrefs.gradingScale.trim()) {
        throw new Error("Grading scale is required");
      }

      goToNextStep();
      await api.updateOnboardingStep(4, assessmentPrefs);
    });

  const saveFacultyStep5 = () =>
    handleSaveStep(async () => {
      const assignmentIds = confirmedAssignmentIds as string[];

      if (facultyAssignments.length && !assignmentIds.length) {
        throw new Error("Confirm at least one engineering subject assignment before finishing setup");
      }
      if (!facultyTeachingStyles.length) {
        throw new Error("Choose at least one teaching preference");
      }
      if (!facultyConsents.teacherVerifiedAi || !facultyConsents.academicIntegrity || !facultyConsents.dataPolicy) {
        throw new Error("All mandatory faculty consent checkboxes must be accepted");
      }

      const activeRows = activeFacultyAssignments.length ? activeFacultyAssignments : facultyAssignments;
      await api.completeFacultyOnboarding({
        confirmed_assignment_ids: assignmentIds,
        teaching_styles: facultyTeachingStyles,
        subject_confidence: Object.fromEntries(
          activeRows
            .map((row: any) => row.course?.id || row.assignment?.course_id)
            .filter(Boolean)
            .map((courseId: string) => [courseId, facultySubjectConfidence[courseId] ?? 0.7]),
        ),
        teaching_goal: facultyGoal,
        primary_device: facultyDeviceType,
        internet_type: facultyInternetType,
        consents: facultyConsents,
      });
      await api.refreshSession();
      clearSnapshot(role);
      routeByRole(role);
    });

  const saveStudentStep1 = () =>
    handleSaveStep(async () => {
      raiseIfInvalid(
        validateRequiredName(studentProfile.fullName, "Full name"),
        validateOptionalPhone(studentProfile.phone, "Student phone number"),
      );
      if (!studentProfile.registerNumber.trim() || !studentProfile.dob) {
        throw new Error("Register number and date of birth are required");
      }

      goToNextStep();
      await api.updateOnboardingStep(1, {
        fullName: studentProfile.fullName,
        registerNumber: studentProfile.registerNumber,
        dob: studentProfile.dob,
        phone: studentProfile.phone,
      });
    });

  const saveStudentStep2 = () =>
    handleSaveStep(async () => {
      // If batch is genuinely missing, auto-flag a correction request instead of blocking.
      // Students should never be hard-blocked here — they can continue and admin resolves it.
      const effectiveConfirmBatch = !!(resolvedStudentBatch || batchId);
      const effectiveCorrectionMessage = !effectiveConfirmBatch
        ? correctionMessage.trim() || "Batch not yet assigned — awaiting admin resolution"
        : correctionMessage.trim();

      if (!effectiveConfirmBatch && !effectiveCorrectionMessage) {
        // Still proceed — the backend will file a correction request automatically
      }

      goToNextStep();
      await api.updateOnboardingStep(2, {
        batchId: batchId || null,
        confirmBatch: effectiveConfirmBatch,
        correctionMessage: effectiveCorrectionMessage,
      });
    });

  const saveStudentStep3 = () =>
    handleSaveStep(async () => {
      // If subjects haven't been mapped by HOD yet, allow progression with a toast warning.
      // Student can revisit subject selection from their profile once subjects are available.
      if (!subjectsList.length) {
        toast.warning("No subjects available yet — your HOD will assign them soon. You can still finish setup and they will be linked automatically.");
      }
      goToNextStep();
      await api.updateOnboardingStep(3, {
        selectedElectives: selectedElectives.length ? selectedElectives : [],
      });
    });

  const saveStudentStep4 = () =>
    handleSaveStep(async () => {
      raiseIfInvalid(
        validateOptionalPhone(studentProfile.emergencyContact, "Emergency contact number"),
        validateOptionalEmail(studentProfile.parentEmail, "Parent email"),
      );
      // Photo URL is optional — students can update their profile photo later from Settings.

      goToNextStep();
      await api.updateOnboardingStep(4, {
        phone: studentProfile.phone,
        emergencyContact: studentProfile.emergencyContact,
        parentEmail: studentProfile.parentEmail,
        photoUrl: studentProfile.photoUrl || null,
        profilePhotoUrl: studentProfile.photoUrl || null,
      });
    });

  const saveStudentStep5 = () =>
    handleSaveStep(async () => {
      const subjectIds = (selectedElectives.length
        ? selectedElectives
        : activeStudentSubjects.map((subject) => subject.id).filter(Boolean)) as string[];

      // Only consents are mandatory — everything else can be completed/corrected post-onboarding
      if (!consents.teacherVerifiedAi || !consents.academicIntegrity || !consents.dataPolicy) {
        throw new Error("Please accept all three consent checkboxes to continue");
      }
      if (!learningStyles.length) {
        throw new Error("Choose at least one learning preference before finishing setup");
      }

      // Batch/subject missing: warn but don't block — admin can resolve these later
      if (!resolvedStudentBatch && !batchId) {
        toast.warning("Batch not yet assigned — your admin will link it soon. Proceeding with setup.");
      }
      if (!subjectIds.length) {
        toast.warning("No subjects mapped yet — your HOD will assign them soon.");
      }

      await api.completeStudentOnboarding({
        class_id: studentClassId || null,
        subject_ids: subjectIds,
        learning_styles: learningStyles,
        skill_levels: Object.fromEntries(
          subjectIds.map((subjectId) => [subjectId, skillLevels[subjectId] ?? 0.5]),
        ),
        goal: studentGoal,
        device_type: deviceType,
        internet_type: internetType,
        consents,
        batch_confirmed: !!(resolvedStudentBatch || batchId),
        batch_confirmation_note: correctionMessage.trim() || null,
      });
      await api.refreshSession();
      clearSnapshot(role);
      routeByRole(role);
    });

  const renderCollegeSteps = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">College Name</label>
              <input
                className={baseInputClass}
                placeholder="e.g. Lumina Institute of Technology"
                value={collegeProfile.collegeName}
                onChange={(e) => setCollegeProfile((prev) => ({ ...prev, collegeName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">College Code</label>
              <input
                className={baseInputClass}
                placeholder="e.g. LIT"
                value={collegeProfile.collegeCode}
                onChange={(e) => setCollegeProfile((prev) => ({ ...prev, collegeCode: e.target.value }))}
              />
            </div>
          </div>
          <button className={primaryButtonClass} onClick={saveCollegeStep1} disabled={saving}>
            {saving ? "SAVING IDENTITY..." : "NEXT STEP: DEPARTMENTS"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Departments</h2>
              <p className="text-gray-400 text-sm">Add departments and invite HODs with real email addresses.</p>
            </div>
            <button
              className="p-3 bg-lumina-primary/10 border border-lumina-primary/20 rounded-xl text-lumina-primary hover:bg-lumina-primary hover:text-black transition-all"
              onClick={() => setDepartments((prev) => [...prev, makeEmptyDepartment()])}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {departments.map((dept, idx) => (
              <div key={idx} className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className={baseInputClass}
                    placeholder="Department name"
                    value={dept.name}
                    onChange={(e) => updateDepartmentDraft(idx, "name", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Abbreviation"
                    value={dept.abbreviation}
                    onChange={(e) => updateDepartmentDraft(idx, "abbreviation", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="HOD email"
                    value={dept.hodEmail}
                    onChange={(e) => updateDepartmentDraft(idx, "hodEmail", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Intake strength"
                    value={dept.intakeStrength}
                    onChange={(e) => updateDepartmentDraft(idx, "intakeStrength", e.target.value)}
                  />
                </div>
                {departments.length > 1 && (
                  <button
                    className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => setDepartments((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className={secondaryButtonClass} onClick={saveCollegeStep2} disabled={saving}>
            {saving ? "CREATING DEPARTMENTS..." : "SAVE DEPARTMENTS"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Academic Year</label>
              <input
                className={baseInputClass}
                placeholder="e.g. 2025-2026"
                value={collegeProfile.academicYear}
                onChange={(e) => setCollegeProfile((prev) => ({ ...prev, academicYear: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Logo URL</label>
              <input
                className={baseInputClass}
                placeholder="https://..."
                value={collegeProfile.logoUrl}
                onChange={(e) => setCollegeProfile((prev) => ({ ...prev, logoUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">City</label>
              <input
                className={baseInputClass}
                placeholder="City"
                value={collegeProfile.city}
                onChange={(e) => setCollegeProfile((prev) => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">State</label>
              <input
                className={baseInputClass}
                placeholder="State"
                value={collegeProfile.state}
                onChange={(e) => setCollegeProfile((prev) => ({ ...prev, state: e.target.value }))}
              />
            </div>
          </div>

          <button className={primaryButtonClass} onClick={saveCollegeStep3} disabled={saving}>
            {saving ? "SAVING ACADEMICS..." : "SAVE ACADEMIC CONFIG"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Login Policy</h2>
            <p className="text-gray-400 text-sm">Choose how users are allowed to sign in.</p>
            {[
              { value: "email_only", label: "Email only", description: "Use standard email/password onboarding." },
              { value: "oauth_allowed", label: "Email + OAuth", description: "Allow email login and OAuth providers." },
              { value: "sso", label: "SSO required", description: "Restrict access to institution-managed SSO." },
            ].map((option) => (
              <label
                key={option.value}
                className={`block border rounded-2xl p-5 cursor-pointer transition-all ${
                  loginPolicy === option.value
                    ? "border-lumina-primary bg-lumina-primary/10"
                    : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <input
                  type="radio"
                  name="login-policy"
                  className="hidden"
                  checked={loginPolicy === option.value}
                  onChange={() => setLoginPolicy(option.value as typeof loginPolicy)}
                />
                <div className="flex items-start gap-3">
                  {loginPolicy === option.value ? (
                    <CheckCircle2 className="w-5 h-5 text-lumina-primary mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-500 mt-0.5" />
                  )}
                  <div>
                    <p className="font-semibold">{option.label}</p>
                    <p className="text-sm text-gray-400">{option.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button className={secondaryButtonClass} onClick={saveCollegeStep4} disabled={saving}>
            {saving ? "SAVING POLICY..." : "SAVE ACCESS POLICY"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-4">
          <h2 className="text-2xl font-bold">Activate Institution</h2>
          <p className="text-gray-400">
            This will mark onboarding as complete and activate the institution for normal sign-in and dashboard access.
          </p>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              checked={activateCollege}
              onChange={(e) => setActivateCollege(e.target.checked)}
            />
            <span className="text-sm text-gray-300">
              I confirm the institution details, department setup, and access policy are ready to go live.
            </span>
          </label>
        </div>

        <button className={primaryButtonClass} onClick={saveCollegeStep5} disabled={saving}>
          {saving ? "ACTIVATING..." : "COMPLETE ONBOARDING"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderHodSteps = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              className={baseInputClass}
              placeholder="Department name"
              value={deptProfile.name}
              onChange={(e) => setDeptProfile((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Abbreviation"
              value={deptProfile.abbreviation}
              onChange={(e) => setDeptProfile((prev) => ({ ...prev, abbreviation: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Intake strength"
              value={deptProfile.intakeStrength}
              onChange={(e) => setDeptProfile((prev) => ({ ...prev, intakeStrength: e.target.value }))}
            />
            <textarea
              className={`${baseInputClass} md:col-span-2 min-h-28`}
              placeholder="Department description"
              value={deptProfile.description}
              onChange={(e) => setDeptProfile((prev) => ({ ...prev, description: e.target.value }))}
            />
          </div>
          <button className={primaryButtonClass} onClick={saveHodStep1} disabled={saving}>
            {saving ? "SAVING DEPARTMENT..." : "SAVE DEPARTMENT PROFILE"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Subjects</h2>
              <p className="text-gray-400 text-sm">Create the subjects that belong to this department.</p>
            </div>
            <button
              className="p-3 bg-lumina-primary/10 border border-lumina-primary/20 rounded-xl text-lumina-primary hover:bg-lumina-primary hover:text-black transition-all"
              onClick={() => setSubjects((prev) => [...prev, makeEmptySubject()])}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {subjects.map((subject, idx) => (
              <div key={idx} className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className={baseInputClass}
                    placeholder="Subject name"
                    value={subject.name}
                    onChange={(e) => updateSubjectDraft(idx, "name", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Subject code"
                    value={subject.code}
                    onChange={(e) => updateSubjectDraft(idx, "code", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Credits"
                    value={subject.credits}
                    onChange={(e) => updateSubjectDraft(idx, "credits", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Semester"
                    value={subject.semester}
                    onChange={(e) => updateSubjectDraft(idx, "semester", e.target.value)}
                  />
                  <select
                    className={`${baseInputClass} md:col-span-2`}
                    value={subject.type}
                    onChange={(e) => updateSubjectDraft(idx, "type", e.target.value)}
                  >
                    <option value="core">Core</option>
                    <option value="elective">Elective</option>
                    <option value="lab">Lab</option>
                  </select>
                </div>
                {subjects.length > 1 && (
                  <button
                    className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => setSubjects((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className={secondaryButtonClass} onClick={saveHodStep2} disabled={saving}>
            {saving ? "CREATING SUBJECTS..." : "SAVE SUBJECTS"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Batches</h2>
              <p className="text-gray-400 text-sm">Create batch labels, sections, and their current semester.</p>
            </div>
            <button
              className="p-3 bg-lumina-primary/10 border border-lumina-primary/20 rounded-xl text-lumina-primary hover:bg-lumina-primary hover:text-black transition-all"
              onClick={() => setBatches((prev) => [...prev, makeEmptyBatch()])}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {batches.map((batch, idx) => (
              <div key={idx} className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className={baseInputClass}
                    placeholder="Batch year"
                    value={batch.year}
                    onChange={(e) => updateBatchDraft(idx, "year", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Label"
                    value={batch.label}
                    onChange={(e) => updateBatchDraft(idx, "label", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Sections (e.g. A, B)"
                    value={batch.sections}
                    onChange={(e) => updateBatchDraft(idx, "sections", e.target.value)}
                  />
                  <input
                    className={baseInputClass}
                    placeholder="Current semester"
                    value={batch.currentSemester}
                    onChange={(e) => updateBatchDraft(idx, "currentSemester", e.target.value)}
                  />
                </div>
                {batches.length > 1 && (
                  <button
                    className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => setBatches((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className={primaryButtonClass} onClick={saveHodStep3} disabled={saving}>
            {saving ? "CREATING BATCHES..." : "SAVE BATCHES"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Faculty Assignments</h2>
              <p className="text-gray-400 text-sm">Map subjects to faculty and batches.</p>
            </div>
            <button
              className="p-3 bg-lumina-primary/10 border border-lumina-primary/20 rounded-xl text-lumina-primary hover:bg-lumina-primary hover:text-black transition-all"
              onClick={() => setAssignments((prev) => [...prev, makeEmptyAssignment()])}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
            {assignments.map((assignment, idx) => (
              <div key={idx} className="relative bg-white/[0.02] border border-white/10 rounded-3xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <select
                    className={baseInputClass}
                    value={assignment.subjectId}
                    onChange={(e) => updateAssignmentDraft(idx, "subjectId", e.target.value)}
                  >
                    <option value="">Select subject</option>
                    {subjectsList.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.course_name || subject.name} ({subject.course_code || subject.code})
                      </option>
                    ))}
                  </select>
                  <select
                    className={baseInputClass}
                    value={assignment.batchId}
                    onChange={(e) => {
                      const nextBatchId = e.target.value;
                      const batch = batchesList.find((item) => item.id === nextBatchId);
                      updateAssignmentDraft(idx, "batchId", nextBatchId);
                      updateAssignmentDraft(idx, "section", Array.isArray(batch?.sections) ? batch.sections[0] || "" : "");
                    }}
                  >
                    <option value="">Select batch</option>
                    {batchesList.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.label}
                      </option>
                    ))}
                  </select>
                  <select
                    className={baseInputClass}
                    value={assignment.section}
                    onChange={(e) => updateAssignmentDraft(idx, "section", e.target.value)}
                  >
                    <option value="">Select section</option>
                    {(batchesList.find((item) => item.id === assignment.batchId)?.sections || []).map((section: string) => (
                      <option key={section} value={section}>
                        {section}
                      </option>
                    ))}
                  </select>
                  <select
                    className={baseInputClass}
                    value={assignment.facultyId}
                    onChange={(e) => updateAssignmentDraft(idx, "facultyId", e.target.value)}
                  >
                    <option value="">Select faculty</option>
                    {facultyUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name || user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                {assignments.length > 1 && (
                  <button
                    className="absolute -top-2 -right-2 w-8 h-8 bg-black border border-white/10 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    onClick={() => setAssignments((prev) => prev.filter((_, itemIdx) => itemIdx !== idx))}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button className={secondaryButtonClass} onClick={saveHodStep4} disabled={saving}>
            {saving ? "ASSIGNING..." : "SAVE FACULTY ASSIGNMENTS"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
          <h2 className="text-2xl font-bold mb-3">Review Complete</h2>
          <p className="text-gray-400">
            Department profile, subjects, batches, and faculty mappings have been captured. Finish onboarding to open the HOD dashboard.
          </p>
        </div>
        <button className={primaryButtonClass} onClick={saveHodStep5} disabled={saving}>
          {saving ? "FINALIZING..." : "ENTER HOD DASHBOARD"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderFacultySteps = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              className={baseInputClass}
              placeholder="Full name"
              value={facultyProfile.fullName}
              onChange={(e) => setFacultyProfile((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Employee ID"
              value={facultyProfile.employeeId}
              onChange={(e) => setFacultyProfile((prev) => ({ ...prev, employeeId: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Phone number"
              value={facultyProfile.phone}
              onChange={(e) => setFacultyProfile((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <button className={primaryButtonClass} onClick={saveFacultyStep1} disabled={saving}>
            {saving ? "SAVING PROFILE..." : "SAVE PROFILE"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Assignment Confirmation</h2>
            <p className="text-gray-400 text-sm">Confirm the teaching assignments currently linked to your account.</p>
            {!facultyAssignments.length ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-gray-400">
                No assignments are linked yet. You can continue and complete them later once the HOD maps courses to your account.
              </div>
            ) : (
              facultyAssignments.map((row: any) => {
                const assignmentId = row.assignment?.id;
                const checked = confirmedAssignmentIds.includes(assignmentId);
                return (
                  <label
                    key={assignmentId}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={(e) =>
                        setConfirmedAssignmentIds((prev) =>
                          e.target.checked
                            ? [...prev, assignmentId]
                            : prev.filter((id) => id !== assignmentId),
                        )
                      }
                    />
                    <div>
                      <p className="font-semibold">
                        {row.course?.course_name || row.course?.name || "Untitled subject"}
                      </p>
                      <p className="text-sm text-gray-400">
                        Batch: {row.batch?.label || row.assignment?.batch_id || "N/A"} | Section: {row.assignment?.section || row.class?.section || "All"}
                      </p>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <button className={secondaryButtonClass} onClick={saveFacultyStep2} disabled={saving}>
            {saving ? "SAVING ASSIGNMENTS..." : "CONFIRM ASSIGNMENTS"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <input
              className={baseInputClass}
              placeholder="Specialization"
              value={facultyProfile.specialization}
              onChange={(e) => setFacultyProfile((prev) => ({ ...prev, specialization: e.target.value }))}
            />
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-gray-400">
              Use this step to record your teaching focus so the system stores a real faculty profile rather than placeholder onboarding progress.
            </div>
          </div>
          <button className={primaryButtonClass} onClick={saveFacultyStep3} disabled={saving}>
            {saving ? "SAVING TEACHING PROFILE..." : "SAVE TEACHING PROFILE"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6">
            <input
              className={baseInputClass}
              placeholder="Grading scale"
              value={assessmentPrefs.gradingScale}
              onChange={(e) => setAssessmentPrefs((prev) => ({ ...prev, gradingScale: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Minimum attendance percent"
              value={assessmentPrefs.minAttendancePercent}
              onChange={(e) => setAssessmentPrefs((prev) => ({ ...prev, minAttendancePercent: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Late policy"
              value={assessmentPrefs.latePolicy}
              onChange={(e) => setAssessmentPrefs((prev) => ({ ...prev, latePolicy: e.target.value }))}
            />
          </div>
          <button className={secondaryButtonClass} onClick={saveFacultyStep4} disabled={saving}>
            {saving ? "SAVING POLICY..." : "SAVE ASSESSMENT POLICY"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Step 5: Teaching Profile and Engineering Delivery Setup</h2>
            <p className="text-gray-400 mt-2">
              Finalize your engineering batches, subject confidence, teaching mode, and AI governance preferences before entering the faculty dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academic Delivery Context</h3>
            {activeFacultyAssignments.length ? (
              <div className="space-y-3">
                {activeFacultyAssignments.map((row: any) => (
                  <div key={row.assignment?.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="font-semibold">{row.course?.course_name || row.course?.name || "Untitled subject"}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {row.course?.course_code || row.course?.code || "No code"} | Batch {row.batch?.label || row.assignment?.batch_id || "N/A"} | Section {row.assignment?.section || row.class?.section || "All"}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Program: {row.program?.program_name || row.program?.name || "Engineering"} | Semester {row.course?.semester || row.batch?.current_semester || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-gray-400">
                No HOD-mapped engineering batches are linked yet. You can still finish setup, and the system will attach the teaching context once assignments are mapped.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Teaching Preference Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FACULTY_TEACHING_STYLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={facultyTeachingStyles.includes(option.value)}
                    onChange={(e) =>
                      setFacultyTeachingStyles((prev) =>
                        e.target.checked
                          ? [...prev, option.value]
                          : prev.filter((item) => item !== option.value),
                      )
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Subject Readiness Self-Assessment</h3>
            <div className="space-y-4">
              {activeFacultyAssignments.length ? (
                activeFacultyAssignments.map((row: any) => {
                  const courseId = row.course?.id || row.assignment?.course_id;
                  const value = facultySubjectConfidence[courseId] ?? 0.7;
                  return (
                    <div key={row.assignment?.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{row.course?.course_name || row.course?.name || "Untitled subject"}</p>
                          <p className="text-sm text-gray-400">
                            {row.course?.course_code || row.course?.code || "No code"} | Batch {row.batch?.label || row.assignment?.batch_id || "N/A"}
                          </p>
                        </div>
                        <span className="text-sm text-lumina-primary font-semibold">{Math.round(value * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="w-full"
                        value={Math.round(value * 100)}
                        onChange={(e) =>
                          setFacultySubjectConfidence((prev) => ({
                            ...prev,
                            [courseId]: Number(e.target.value) / 100,
                          }))
                        }
                      />
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-gray-400">
                  Confirm teaching assignments in Step 2 to initialize subject readiness scoring here.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Teaching Goals and Device Setup</h3>
            <div className="space-y-3">
              {FACULTY_GOAL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="faculty-goal"
                    className="mt-1"
                    checked={facultyGoal === option.value}
                    onChange={() => setFacultyGoal(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className={baseInputClass} value={facultyDeviceType} onChange={(e) => setFacultyDeviceType(e.target.value)}>
                <option value="mobile">Primary device: Mobile</option>
                <option value="laptop">Primary device: Laptop</option>
                <option value="both">Primary device: Both</option>
              </select>
              <select className={baseInputClass} value={facultyInternetType} onChange={(e) => setFacultyInternetType(e.target.value)}>
                <option value="stable">Internet: Stable</option>
                <option value="limited">Internet: Limited</option>
                <option value="mostly_offline">Internet: Mostly offline</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Consent and Review</h3>
            <div className="space-y-3">
              {[
                ["teacherVerifiedAi", "I will review AI-generated academic responses before they reach students"],
                ["academicIntegrity", "I will publish grades, attendance, and interventions responsibly"],
                ["dataPolicy", "I agree to handle student data according to Lumina privacy policy"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(facultyConsents[key as keyof typeof facultyConsents])}
                    onChange={(e) =>
                      setFacultyConsents((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300 space-y-2">
              <p><span className="text-gray-500">Assignments confirmed:</span> {activeFacultyAssignments.length || 0}</p>
              <p><span className="text-gray-500">Subjects:</span> {activeFacultyAssignments.map((row: any) => row.course?.course_code || row.course?.code || row.course?.course_name || row.course?.name).join(", ") || "None linked yet"}</p>
              <p><span className="text-gray-500">Goal:</span> {FACULTY_GOAL_OPTIONS.find((option) => option.value === facultyGoal)?.label || facultyGoal}</p>
              <p><span className="text-gray-500">Teaching styles:</span> {facultyTeachingStyles.map((style) => FACULTY_TEACHING_STYLE_OPTIONS.find((option) => option.value === style)?.label || style).join(", ") || "None selected"}</p>
              <p><span className="text-gray-500">Assessment policy:</span> {assessmentPrefs.gradingScale} | Attendance {assessmentPrefs.minAttendancePercent}% | {assessmentPrefs.latePolicy}</p>
            </div>
          </div>
        </div>

        <button className={primaryButtonClass} onClick={saveFacultyStep5} disabled={saving}>
          {saving ? "INITIALIZING TEACHING PROFILE..." : "FINISH SETUP AND ENTER FACULTY DASHBOARD"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderStudentSteps = () => {
    if (currentStep === 1) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              className={baseInputClass}
              placeholder="Full name"
              value={studentProfile.fullName}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, fullName: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Register number"
              value={studentProfile.registerNumber}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, registerNumber: e.target.value }))}
            />
            <input
              type="date"
              className={baseInputClass}
              value={studentProfile.dob}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, dob: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Phone number"
              value={studentProfile.phone}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <button className={primaryButtonClass} onClick={saveStudentStep1} disabled={saving}>
            {saving ? "SAVING PROFILE..." : "SAVE PERSONAL DETAILS"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-8">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-4">
            <h2 className="text-2xl font-bold">Batch Confirmation</h2>
            <p className="text-gray-400">
              Confirm the batch currently linked to your account. If it is wrong, continue and we will log a correction request.
            </p>
            {(studentIssues.missingBatchLink || !resolvedStudentBatch) && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                Batch mapping is missing on your account. Finish linking your enrollment code or ask your admin/HOD to attach your batch before onboarding can complete.
              </div>
            )}
            <div className="text-sm text-gray-300 space-y-1">
              <p>Department: {deptId || "Not linked"}</p>
              <p>Batch: {resolvedStudentBatch?.label || batchId || "Not linked"}</p>
              <p>Section: {Array.isArray(resolvedStudentBatch?.sections) ? resolvedStudentBatch.sections.join(", ") : "Not available"}</p>
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmBatch}
                onChange={(e) => setConfirmBatch(e.target.checked)}
              />
              <span className="text-sm text-gray-300">My batch and section details are correct.</span>
            </label>
            {!confirmBatch && (
              <textarea
                className={`${baseInputClass} min-h-24`}
                placeholder="Describe the correction needed"
                value={correctionMessage}
                onChange={(e) => setCorrectionMessage(e.target.value)}
              />
            )}
          </div>
          <button className={secondaryButtonClass} onClick={saveStudentStep2} disabled={saving}>
            {saving ? "SAVING BATCH CONFIRMATION..." : "CONFIRM BATCH"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Electives and Subjects</h2>
            <p className="text-gray-400 text-sm">Choose the subjects relevant to your current semester.</p>
          </div>
          {studentIssues.missingSubjects && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              No subjects are mapped to your current batch and semester yet. This must be fixed in the backend data before student onboarding can complete.
            </div>
          )}
          {!subjectsList.length ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-gray-400">
              No semester subjects are available yet. Ask your HOD or admin to map subjects for this batch before you continue.
            </div>
          ) : (
            <div className="space-y-3">
              {subjectsList.map((subject) => {
                const subjectId = subject.id;
                const selected = selectedElectives.includes(subjectId);
                return (
                  <label
                    key={subjectId}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selected}
                      onChange={(e) =>
                        setSelectedElectives((prev) =>
                          e.target.checked
                            ? [...prev, subjectId]
                            : prev.filter((item) => item !== subjectId),
                        )
                      }
                    />
                    <div>
                      <p className="font-semibold">{subject.course_name || subject.name}</p>
                      <p className="text-sm text-gray-400">
                        {subject.course_code || subject.code} | Semester {subject.semester} | {subject.type || "core"}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <button className={primaryButtonClass} onClick={saveStudentStep3} disabled={saving}>
            {saving ? "SAVING SUBJECTS..." : "SAVE SUBJECT SELECTION"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              className={baseInputClass}
              placeholder="Emergency contact number"
              value={studentProfile.emergencyContact}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, emergencyContact: e.target.value }))}
            />
            <input
              className={baseInputClass}
              placeholder="Parent email"
              value={studentProfile.parentEmail}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, parentEmail: e.target.value }))}
            />
            <input
              className={`${baseInputClass} md:col-span-2`}
              placeholder="Profile photo URL"
              value={studentProfile.photoUrl}
              onChange={(e) => setStudentProfile((prev) => ({ ...prev, photoUrl: e.target.value }))}
            />
          </div>
          <button className={secondaryButtonClass} onClick={saveStudentStep4} disabled={saving}>
            {saving ? "SAVING PROFILE MEDIA..." : "SAVE PROFILE COMPLETION"}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Step 5: Learning Profile and Engineering Setup</h2>
            <p className="text-gray-400 mt-2">
              Finalize your batch confirmation, class context, learning preferences, self-assessment, and AI personalization before entering the dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Academic Context</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500">Batch</p>
                <p className="mt-2 font-semibold">{resolvedStudentBatch?.label || "Not linked"}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Semester {resolvedStudentBatch?.current_semester || "N/A"} | Section {Array.isArray(resolvedStudentBatch?.sections) ? resolvedStudentBatch.sections.join(", ") : "N/A"}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-widest text-gray-500">Current Section</p>
                <p className="mt-2 font-semibold">{studentBatchInfo?.section || resolvedStudentBatch?.section || "Mapped from account"}</p>
                <p className="text-sm text-gray-400 mt-1">Confirm this matches your engineering batch allocation.</p>
              </div>
              <select
                className={`${baseInputClass} md:col-span-2`}
                value={studentClassId}
                onChange={(e) => setStudentClassId(e.target.value)}
              >
                <option value="">Select class / section</option>
                {studentClasses.map((studentClass) => (
                  <option key={studentClass.id} value={studentClass.id}>
                    {(studentClass.class_name || studentClass.section_name || "Class")} | {studentClass.batch || studentClass.batch_name || "Batch"} | {studentClass.section || studentClass.section_name || "Section"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Learning Preference Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {STUDENT_LEARNING_STYLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={learningStyles.includes(option.value)}
                    onChange={(e) =>
                      setLearningStyles((prev) =>
                        e.target.checked
                          ? [...prev, option.value]
                          : prev.filter((item) => item !== option.value),
                      )
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Skill Self-Assessment</h3>
            <div className="space-y-4">
              {activeStudentSubjects.length ? (
                activeStudentSubjects.map((subject) => {
                  const subjectId = subject.id;
                  const value = skillLevels[subjectId] ?? 0.5;
                  return (
                    <div key={subjectId} className="rounded-2xl border border-white/10 bg-black/20 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{subject.course_name || subject.name}</p>
                          <p className="text-sm text-gray-400">{subject.course_code || subject.code}</p>
                        </div>
                        <span className="text-sm text-lumina-primary font-semibold">{Math.round(value * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        className="w-full"
                        value={Math.round(value * 100)}
                        onChange={(e) =>
                          setSkillLevels((prev) => ({
                            ...prev,
                            [subjectId]: Number(e.target.value) / 100,
                          }))
                        }
                      />
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-gray-400">
                  Select your engineering subjects in Step 3 to initialize skill assessment here.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Goal and Device Setup</h3>
            <div className="space-y-3">
              {STUDENT_GOAL_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="student-goal"
                    className="mt-1"
                    checked={studentGoal === option.value}
                    onChange={() => setStudentGoal(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select className={baseInputClass} value={deviceType} onChange={(e) => setDeviceType(e.target.value)}>
                <option value="mobile">Primary device: Mobile</option>
                <option value="laptop">Primary device: Laptop</option>
                <option value="both">Primary device: Both</option>
              </select>
              <select className={baseInputClass} value={internetType} onChange={(e) => setInternetType(e.target.value)}>
                <option value="stable">Internet: Stable</option>
                <option value="limited">Internet: Limited</option>
                <option value="mostly_offline">Internet: Mostly offline</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Consent and Review</h3>
            <div className="space-y-3">
              {[
                ["teacherVerifiedAi", "I understand AI answers are verified or governed by my teachers"],
                ["academicIntegrity", "I will complete assignments with academic integrity"],
                ["dataPolicy", "I agree to the data usage and privacy policy"],
              ].map(([key, label]) => (
                <label key={key} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={Boolean(consents[key as keyof typeof consents])}
                    onChange={(e) =>
                      setConsents((prev) => ({
                        ...prev,
                        [key]: e.target.checked,
                      }))
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300 space-y-2">
              <p><span className="text-gray-500">Batch:</span> {resolvedStudentBatch?.label || "Not linked"}</p>
              {studentIssues.missingProgramLink && (
                <p><span className="text-gray-500">Program mapping:</span> Missing. We will still save your setup, but admin data should be completed for class/program reporting.</p>
              )}
              <p><span className="text-gray-500">Class:</span> {studentClasses.find((item) => item.id === studentClassId)?.class_name || studentClasses.find((item) => item.id === studentClassId)?.section_name || "Not selected"}</p>
              <p><span className="text-gray-500">Subjects:</span> {activeStudentSubjects.map((subject) => subject.course_code || subject.code || subject.course_name || subject.name).join(", ") || "None"}</p>
              <p><span className="text-gray-500">Goal:</span> {STUDENT_GOAL_OPTIONS.find((option) => option.value === studentGoal)?.label || studentGoal}</p>
              <p><span className="text-gray-500">Learning style:</span> {learningStyles.map((style) => STUDENT_LEARNING_STYLE_OPTIONS.find((option) => option.value === style)?.label || style).join(", ") || "None selected"}</p>
              <p><span className="text-gray-500">Batch confirmed:</span> {confirmBatch ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>

        <button className={primaryButtonClass} onClick={saveStudentStep5} disabled={saving}>
          {saving ? "INITIALIZING LEARNING PROFILE..." : "FINISH SETUP AND ENTER DASHBOARD"}
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderContent = () => {
    if (isCollegeRole) {
      return renderCollegeSteps();
    }
    if (role === "hod") {
      return renderHodSteps();
    }
    if (role === "faculty") {
      return renderFacultySteps();
    }
    return renderStudentSteps();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 border-4 border-lumina-primary/20 rounded-full animate-pulse" />
          <div className="absolute inset-0 border-4 border-lumina-primary rounded-full border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative flex flex-col items-center justify-start py-20 px-6 overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(245,158,11,0.08),transparent_50%)]" />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl flex items-center justify-between mb-12"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-lumina-primary/10 rounded-2xl flex items-center justify-center border border-lumina-primary/30 shadow-[0_0_20px_rgba(250,204,21,0.2)]">
            <StepIcon className="w-6 h-6 text-lumina-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              {role.replace(/_/g, " ").toUpperCase()} ONBOARDING
            </h1>
            <p className="text-gray-400 text-sm font-medium tracking-widest uppercase">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step < currentStep
                  ? "bg-lumina-primary w-12"
                  : step === currentStep
                    ? "bg-lumina-primary/50 w-20"
                    : "bg-white/10 w-12"
              }`}
            />
          ))}
        </div>
      </motion.div>

      <div className="w-full max-w-4xl">
        {pageError && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-100">
            {pageError}
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${role}-${currentStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-v2-gold rounded-[2.5rem] p-8 md:p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

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
