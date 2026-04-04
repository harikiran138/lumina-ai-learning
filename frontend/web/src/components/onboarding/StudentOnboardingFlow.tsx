"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ImagePlus,
  Loader2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import AdaptiveOnboardingPanel from "@/components/onboarding/AdaptiveOnboardingPanel";
import { useOnboardingStore } from "@/store/useOnboardingStore";
import {
  fieldErrors,
  studentEnrollmentSchema,
  studentPersonalSchema,
  studentPreferencesSchema,
  studentProfileSchema,
  studentSubjectsSchema,
} from "@/lib/student-onboarding";

type EnrollmentPreview = {
  department: { id: string; name: string; code?: string | null };
  batch: { id: string; label: string };
  semester: number | string | null;
  section: string | null;
};

type SubjectOption = {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  credits?: string | number | null;
  semester?: string | number | null;
  type?: string | null;
};

const STEP_META = [
  {
    id: 1,
    title: "Personal Details",
    description: "Capture the student identity data we can trust and persist.",
    icon: UserRound,
  },
  {
    id: 2,
    title: "Enrollment & Batch",
    description: "Validate the enrollment code and attach the real batch mapping.",
    icon: GraduationCap,
  },
  {
    id: 3,
    title: "Subjects",
    description: "Load the semester subjects from the linked batch and require a real selection.",
    icon: BookOpen,
  },
  {
    id: 4,
    title: "Profile Details",
    description: "Collect emergency contact details and a real profile photo upload.",
    icon: ImagePlus,
  },
  {
    id: 5,
    title: "Learning Preferences",
    description: "Store study preferences and a self-assessed starting level before activation.",
    icon: ShieldCheck,
  },
] as const;

const LEARNING_STYLE_OPTIONS = [
  { value: "visual_learner", label: "Visual learner", helper: "Prioritize diagrams, maps, and visual summaries." },
  { value: "step_by_step", label: "Step-by-step", helper: "Break concepts into ordered, guided explanations." },
  { value: "real_world_examples", label: "Real-world examples", helper: "Anchor theory to engineering scenarios and applications." },
  { value: "practice_heavy", label: "Practice-heavy", helper: "Lean on problem sets, drills, and quick checks." },
];

const SELF_ASSESSMENT_OPTIONS = [
  { value: "beginner", label: "Beginner", helper: "Needs foundational guidance and slower pacing." },
  { value: "intermediate", label: "Intermediate", helper: "Can follow standard coursework with support where needed." },
  { value: "advanced", label: "Advanced", helper: "Ready for faster pacing and more challenge." },
];

const baseInputClass =
  "w-full rounded-2xl border border-amber-200/10 bg-zinc-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 placeholder:text-zinc-500";

const cardClass =
  "rounded-[28px] border border-amber-200/10 bg-[linear-gradient(180deg,rgba(255,214,10,0.08),rgba(10,10,10,0.96)_22%,rgba(10,10,10,0.98))] shadow-[0_25px_100px_rgba(0,0,0,0.45)]";

export default function StudentOnboardingFlow() {
  const router = useRouter();
  const saveSnapshot = useOnboardingStore((state) => state.saveSnapshot);
  const clearSnapshot = useOnboardingStore((state) => state.clearSnapshot);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAdaptiveCalibration, setShowAdaptiveCalibration] = useState(false);
  const [adaptiveCompleted, setAdaptiveCompleted] = useState(false);
  const [adaptiveStatus, setAdaptiveStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [completedStep, setCompletedStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [enrollmentPreview, setEnrollmentPreview] = useState<EnrollmentPreview | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
    enrollmentCode: "",
    batchId: "",
    batchLabel: "",
    section: "",
    semester: "",
    departmentName: "",
    selectedSubjectIds: [] as string[],
    emergencyContact: "",
    parentEmail: "",
    profilePhotoFile: null as File | null,
    existingProfilePhotoUrl: "",
    learningStyles: [] as string[],
    selfAssessment: "beginner" as "beginner" | "intermediate" | "advanced",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const draft = useOnboardingStore.getState().snapshots.student || {};
        const draftStudent = draft.student || {};
        const user = await api.getCurrentUser();
        if (!user) {
          window.location.href = "/login";
          return;
        }
        if (user.role !== "student") {
          window.location.href = "/student/dashboard";
          return;
        }

        const status = await api.getOnboardingStatus();
        if (status.role !== "student") {
          window.location.href = "/student/dashboard";
          return;
        }

        const nextCompleted = Number(status.step || 0);
        const adaptiveDone = Boolean(status.adaptiveOnboardingCompleted);
        const adaptiveStage = nextCompleted >= 5 && !adaptiveDone;
        if (nextCompleted >= 5 && adaptiveDone) {
          clearSnapshot("student");
          // Refresh the JWT so the middleware cookie carries onboardingCompleted: true.
          // Without this the browser still holds the login-time token and the
          // middleware loops the student back to /onboarding on every visit.
          await api.completeOnboarding().catch(() => undefined);
          window.location.href = "/student/dashboard";
          return;
        }

        const progress = status.progress || {};
        const step1 = progress.step_1 || {};
        const step2 = progress.step_2 || {};
        const step3 = progress.step_3 || {};
        const step4 = progress.step_4 || {};
        const step5 = progress.step_5 || {};

        setCompletedStep(nextCompleted);
        setCurrentStep(Math.min(5, Math.max(1, adaptiveStage ? 5 : nextCompleted + 1)));
        setShowAdaptiveCalibration(adaptiveStage || Boolean(draft.showAdaptiveCalibration && !adaptiveDone));
        setAdaptiveCompleted(adaptiveDone);
        setAdaptiveStatus(adaptiveDone ? "completed" : status.adaptiveOnboardingStatus || "pending");
        // Prefer DB-sourced batchId (status.batchId is now read from DB after Fix 1).
        // Fall back to progress.step_2 data, then draft snapshot.
        const resolvedBatchId = step2.batchId || status.batchId || draftStudent.batchId || "";

        setStudent((prev) => ({
          ...prev,
          firstName: step1.firstName || draftStudent.firstName || user.name?.split(" ")[0] || "",
          lastName: step1.lastName || draftStudent.lastName || user.name?.split(" ").slice(1).join(" ") || "",
          dateOfBirth: step1.dob || draftStudent.dateOfBirth || "",
          gender: step1.gender || draftStudent.gender || "",
          phoneNumber: step1.phone || draftStudent.phoneNumber || "",
          email: user.email || "",
          enrollmentCode: step2.enrollmentCode || draftStudent.enrollmentCode || "",
          batchId: resolvedBatchId,
          batchLabel: step2.batchLabel || draftStudent.batchLabel || "",
          section: step2.section || draftStudent.section || "",
          semester: step2.semester ? String(step2.semester) : draftStudent.semester || "",
          departmentName: step2.departmentName || draftStudent.departmentName || "",
          selectedSubjectIds: (step3.subjectIds && step3.subjectIds.length ? step3.subjectIds : draftStudent.selectedSubjectIds) || [],
          emergencyContact: step4.emergencyContact || draftStudent.emergencyContact || "",
          parentEmail: step4.parentEmail || draftStudent.parentEmail || "",
          existingProfilePhotoUrl: step4.profilePhotoUrl || draftStudent.existingProfilePhotoUrl || user.avatar || "",
          learningStyles: (step5.learningStyles && step5.learningStyles.length ? step5.learningStyles : draftStudent.learningStyles) || [],
          selfAssessment: step5.selfAssessment || draftStudent.selfAssessment || "beginner",
        }));

        const enrollBatchId  = step2.batchId  || status.batchId  || "";
        const enrollDeptId   = step2.departmentId || status.deptId || "";
        const enrollDeptName = step2.departmentName || "";
        if (enrollBatchId && enrollDeptName) {
          setEnrollmentPreview({
            department: {
              id: enrollDeptId,
              name: enrollDeptName,
            },
            batch: {
              id: enrollBatchId,
              label: step2.batchLabel || "Current batch",
            },
            semester: step2.semester || "",
            section: step2.section || "",
          });
        } else if (draft.enrollmentPreview) {
          setEnrollmentPreview(draft.enrollmentPreview);
        }
      } catch (error: any) {
        const message = error?.message || "Failed to load onboarding";
        setPageError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [clearSnapshot, router]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    saveSnapshot("student", {
      currentStep,
      completedStep,
      showAdaptiveCalibration,
      adaptiveCompleted,
      adaptiveStatus,
      enrollmentPreview,
      student: {
        ...student,
        profilePhotoFile: null,
      },
    });
  }, [
    adaptiveCompleted,
    adaptiveStatus,
    completedStep,
    currentStep,
    enrollmentPreview,
    isLoading,
    saveSnapshot,
    showAdaptiveCalibration,
    student,
  ]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!student.batchId) {
        setSubjectOptions([]);
        return;
      }

      setIsLoadingSubjects(true);
      setPageError(null);
      try {
        const rows = await api.getStudentOnboardingSubjects(student.batchId);
        setSubjectOptions(rows || []);
        // Show a toast if no subjects were returned (but not an error)
        if (!rows || rows.length === 0) {
          console.warn("No subjects available for batch:", student.batchId);
        }
      } catch (error: any) {
        // This should rarely happen now since API returns [] on errors
        const message = error?.message || "Failed to load subjects";
        setPageError(message);
        toast.error(message);
        setSubjectOptions([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    loadSubjects();
  }, [student.batchId]);

  const adaptivePhaseActive = showAdaptiveCalibration && !adaptiveCompleted;
  const completedMilestones = adaptiveCompleted ? 6 : completedStep + (adaptivePhaseActive ? 0.5 : 0);
  const progressWidth = `${Math.max(16, (completedMilestones / 6) * 100)}%`;
  const activeMeta = adaptivePhaseActive
    ? {
        id: 6,
        title: "Adaptive Calibration",
        description: "Finish the short diagnostic so Lumina can personalize pacing, difficulty, and tutor behavior from day one.",
        icon: ShieldCheck,
      }
    : STEP_META[currentStep - 1];

  const setField = (field: keyof typeof student, value: string | string[] | File | null) => {
    setStudent((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[String(field)];
      return next;
    });
    setSuccessMessage(null);
  };

  const toggleSubject = (subjectId: string) => {
    const currentIds = new Set(student.selectedSubjectIds);
    if (currentIds.has(subjectId)) {
      currentIds.delete(subjectId);
    } else {
      currentIds.add(subjectId);
    }
    setField("selectedSubjectIds", Array.from(currentIds));
  };

  const toggleLearningStyle = (value: string) => {
    const currentValues = new Set(student.learningStyles);
    if (currentValues.has(value)) {
      currentValues.delete(value);
    } else {
      currentValues.add(value);
    }
    setField("learningStyles", Array.from(currentValues));
  };

  const validateEnrollmentCode = async () => {
    const result = studentEnrollmentSchema.safeParse({ enrollmentCode: student.enrollmentCode });
    if (!result.success) {
      setErrors(fieldErrors(result) as Record<string, string>);
      return null;
    }

    setIsValidatingCode(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.enrollmentCode;
      return next;
    });

    try {
      const preview = await api.validateEnrollmentCode(student.enrollmentCode.trim().toUpperCase());
      setEnrollmentPreview(preview);
      setStudent((prev) => ({
        ...prev,
        enrollmentCode: prev.enrollmentCode.trim().toUpperCase(),
        batchId: preview.batch?.id || "",
        batchLabel: preview.batch?.label || "",
        section: preview.section || "",
        semester: preview.semester ? String(preview.semester) : "",
        departmentName: preview.department?.name || "",
      }));
      setSuccessMessage("Enrollment code verified. Batch details are ready to link.");
      return preview;
    } catch (error: any) {
      setEnrollmentPreview(null);
      setErrors((prev) => ({ ...prev, enrollmentCode: error?.message || "Enrollment code is invalid" }));
      return null;
    } finally {
      setIsValidatingCode(false);
    }
  };

  const submitCurrentStep = async () => {
    if (isSubmitting) {
      return;
    }

    setErrors({});
    setPageError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (currentStep === 1) {
        const result = studentPersonalSchema.safeParse({
          firstName: student.firstName,
          lastName: student.lastName,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          phoneNumber: student.phoneNumber,
          email: student.email,
        });
        if (!result.success) {
          setErrors(fieldErrors(result) as Record<string, string>);
          setIsSubmitting(false);
          return;
        }

        await api.saveStudentPersonalDetails(result.data);
        setCompletedStep(1);
        setCurrentStep(2);
        setSuccessMessage("Personal details saved successfully.");
        toast.success("Step 1 saved");
        setIsSubmitting(false);
        return;
      }

      if (currentStep === 2) {
        let preview = enrollmentPreview;
        if (!preview) {
          preview = await validateEnrollmentCode();
        }
        if (!preview) {
          setIsSubmitting(false);
          return;
        }

        try {
          const response = await api.saveStudentEnrollment(student.enrollmentCode.trim().toUpperCase());
          const enrollment = response.enrollment || {};

          if (!enrollment.batch?.id) {
            throw new Error("Enrollment response missing batch information. Please try again.");
          }

          // Re-verify DB state — the status endpoint now reads onboarding_step
          // directly from the DB, so this confirms the write actually landed and
          // gives us the authoritative batchId/deptId for step 3.
          let confirmedBatchId = enrollment.batch?.id;
          try {
            const freshStatus = await api.getOnboardingStatus();
            const freshBatchId =
              (freshStatus.progress?.step_2?.batchId) ||
              freshStatus.batchId ||
              enrollment.batch?.id;
            if (freshBatchId) confirmedBatchId = freshBatchId;
            if (freshStatus.step < 2) {
              console.warn("[onboarding] step 2 DB write not yet reflected — using response batchId", {
                dbStep: freshStatus.step, batchId: confirmedBatchId,
              });
            }
          } catch (verifyErr) {
            console.warn("[onboarding] could not re-verify step 2 status:", verifyErr);
          }

          setEnrollmentPreview(enrollment);
          setStudent((prev) => ({
            ...prev,
            batchId: confirmedBatchId || prev.batchId,
            batchLabel: enrollment.batch?.label || prev.batchLabel,
            section: enrollment.section || prev.section,
            semester: enrollment.semester ? String(enrollment.semester) : prev.semester,
            departmentName: enrollment.department?.name || prev.departmentName,
            selectedSubjectIds: [],
          }));
          setCompletedStep(2);
          setCurrentStep(3);
          setSuccessMessage("Enrollment linked and batch mapping saved.");
          toast.success("Step 2 saved");
        } catch (error: any) {
          const message = error?.message || "Failed to save enrollment";
          setPageError(message);
          toast.error(message);
          console.error("[onboarding] enrollment save error:", error);
        } finally {
          setIsSubmitting(false);
        }
        return;
      }

      if (currentStep === 3) {
        const result = studentSubjectsSchema.safeParse({ subjectIds: student.selectedSubjectIds });
        if (!result.success) {
          setErrors(fieldErrors(result) as Record<string, string>);
          return;
        }

        await api.saveStudentSubjects(result.data.subjectIds);
        setCompletedStep(3);
        setCurrentStep(4);
        setSuccessMessage("Subject selection saved.");
        toast.success("Step 3 saved");
        return;
      }

      if (currentStep === 4) {
        const result = studentProfileSchema.safeParse({
          emergencyContact: student.emergencyContact,
          parentEmail: student.parentEmail,
        });
        if (!result.success) {
          setErrors(fieldErrors(result) as Record<string, string>);
          return;
        }

        if (!student.profilePhotoFile && !student.existingProfilePhotoUrl) {
          setErrors({ profilePhoto: "Profile photo is required" });
          return;
        }

        if (student.profilePhotoFile) {
          const allowed = ["image/jpeg", "image/png", "image/webp"];
          if (!allowed.includes(student.profilePhotoFile.type)) {
            setErrors({ profilePhoto: "Profile photo must be a JPG, PNG, or WEBP image" });
            return;
          }
          if (student.profilePhotoFile.size > 5 * 1024 * 1024) {
            setErrors({ profilePhoto: "Profile photo must be smaller than 5 MB" });
            return;
          }
        }

        const formData = new FormData();
        formData.append("emergency_contact", result.data.emergencyContact);
        if (result.data.parentEmail) {
          formData.append("parent_email", result.data.parentEmail);
        }
        if (student.profilePhotoFile) {
          formData.append("profile_photo", student.profilePhotoFile);
        }

        const response = await api.saveStudentProfile(formData);
        setStudent((prev) => ({
          ...prev,
          existingProfilePhotoUrl: response.profile?.profilePhotoUrl || prev.existingProfilePhotoUrl,
          profilePhotoFile: null,
        }));
        setCompletedStep(4);
        setCurrentStep(5);
        setSuccessMessage("Profile details saved.");
        toast.success("Step 4 saved");
        return;
      }

      if (currentStep === 5) {
        const result = studentPreferencesSchema.safeParse({
          learningStyles: student.learningStyles,
          selfAssessment: student.selfAssessment,
        });
        if (!result.success) {
          setErrors(fieldErrors(result) as Record<string, string>);
          return;
        }

        await api.saveStudentPreferences(result.data);
        await api.getCurrentUser().catch(() => undefined);
        setCompletedStep(5);
        setAdaptiveStatus("in_progress");
        setAdaptiveCompleted(false);
        setShowAdaptiveCalibration(true);
        setSuccessMessage("Core onboarding completed. Running adaptive calibration.");
        toast.success("Core onboarding completed");
        return;
      }
    } catch (error: any) {
      const message = error?.message || "Something went wrong";
      setPageError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#090909] px-6 py-12 text-white">
        <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center">
          <div className="flex items-center gap-3 rounded-full border border-amber-300/15 bg-amber-300/10 px-5 py-3 text-sm font-medium text-amber-100">
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing your onboarding workspace
          </div>
        </div>
      </div>
    );
  }

  const handleAdaptiveComplete = async () => {
    setAdaptiveCompleted(true);
    setAdaptiveStatus("completed");
    clearSnapshot("student");
    // CRITICAL: Exchange the stale login JWT for a fresh token that carries
    // onboardingCompleted: true.  The backend /api/onboarding/complete endpoint
    // marks the learner_profile status as "active", rebuilds the JWT claims,
    // and sets an updated access_token cookie.  Without this the Next.js
    // middleware reads onboardingCompleted: false from the old cookie and
    // immediately redirects back to /onboarding — creating an infinite loop.
    await api.completeOnboarding().catch(() => undefined);
    window.location.href = "/student/dashboard";
  };

  return (
    <div className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${cardClass} h-fit p-6`}>
          <div className="rounded-3xl border border-amber-300/15 bg-amber-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">Student Onboarding</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {adaptivePhaseActive ? "Finish calibration before your dashboard unlocks." : "Turn this into a reliable, data-backed setup."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {adaptivePhaseActive
                ? "Your profile is saved. The final diagnostic tunes difficulty, learning style, and the tutor baseline."
                : "Each step saves immediately. Progress only unlocks when the backend accepts valid data."}
            </p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/8 bg-black/40 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-zinc-500">
              <span>Completion</span>
              <span>{adaptiveCompleted ? "6/6" : adaptivePhaseActive ? "5/6" : `${completedStep}/5`}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-white/5">
              <div
                className="h-3 rounded-full bg-[linear-gradient(90deg,#facc15,#fde68a)] transition-all"
                style={{ width: progressWidth }}
              />
            </div>
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {adaptivePhaseActive
                ? "Core onboarding is done. One adaptive checkpoint remains."
                : adaptiveCompleted
                  ? "All onboarding milestones are complete."
                  : "Save each step to move forward."}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {STEP_META.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isDone = completedStep >= step.id;
              const isUnlocked = step.id <= completedStep + 1;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => isUnlocked && setCurrentStep(step.id)}
                  disabled={!isUnlocked || isSubmitting}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    isActive && !adaptivePhaseActive
                      ? "border-amber-300/40 bg-amber-300/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                  } ${!isUnlocked ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        isDone ? "bg-amber-300 text-black" : "bg-white/8 text-amber-200"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">{step.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 rounded-3xl border border-white/8 bg-black/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">Final checkpoint</p>
            <p className="mt-3 text-sm font-semibold text-white">Adaptive calibration</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {adaptiveCompleted
                ? "Completed. Your personalization profile is ready."
                : adaptivePhaseActive
                  ? "In progress. Finish this short diagnostic to unlock the dashboard."
                  : "Starts automatically after Step 5."}
            </p>
          </div>
        </aside>

        <main className={`${cardClass} p-6 sm:p-8`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
                {adaptivePhaseActive ? "Final checkpoint" : `Step ${currentStep}`}
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{activeMeta.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">{activeMeta.description}</p>
            </div>
            <div className="rounded-3xl border border-amber-300/10 bg-black/35 px-5 py-4 text-sm text-zinc-300">
              <p className="font-medium text-white">{student.email}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">Verified account email</p>
            </div>
          </div>

          {pageError ? (
            <div className="mt-6 flex items-start gap-3 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{pageError}</p>
            </div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 flex items-start gap-3 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{successMessage}</p>
            </div>
          ) : null}

          <div className="mt-8">
            {showAdaptiveCalibration ? (
              <AdaptiveOnboardingPanel onComplete={handleAdaptiveComplete} />
            ) : null}

            {currentStep === 1 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="First Name"
                  helper="Required. This is stored against the student profile."
                  error={errors.firstName}
                >
                  <input
                    className={baseInputClass}
                    placeholder="Enter first name"
                    value={student.firstName}
                    onChange={(event) => setField("firstName", event.target.value)}
                  />
                </Field>
                <Field
                  label="Last Name"
                  helper="Required. Keep this consistent with institution records."
                  error={errors.lastName}
                >
                  <input
                    className={baseInputClass}
                    placeholder="Enter last name"
                    value={student.lastName}
                    onChange={(event) => setField("lastName", event.target.value)}
                  />
                </Field>
                <Field label="Date of Birth" helper="Required. Used for profile verification." error={errors.dateOfBirth}>
                  <input
                    className={baseInputClass}
                    type="date"
                    value={student.dateOfBirth}
                    onChange={(event) => setField("dateOfBirth", event.target.value)}
                  />
                </Field>
                <Field label="Gender" helper="Optional. Stored only if provided." error={errors.gender}>
                  <select
                    className={baseInputClass}
                    value={student.gender}
                    onChange={(event) => setField("gender", event.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field
                  label="Phone Number"
                  helper="Required. Numbers only are ideal; formatting is accepted."
                  error={errors.phoneNumber}
                >
                  <input
                    className={baseInputClass}
                    placeholder="+91 9876543210"
                    value={student.phoneNumber}
                    onChange={(event) => setField("phoneNumber", event.target.value)}
                  />
                </Field>
                <Field label="Email" helper="Pulled from the signed-in account and locked." error={errors.email}>
                  <input className={`${baseInputClass} cursor-not-allowed opacity-70`} value={student.email} readOnly />
                </Field>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-6">
                <Field
                  label="Enrollment Code"
                  helper="Use the code issued by your department or batch coordinator."
                  error={errors.enrollmentCode}
                >
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className={`${baseInputClass} font-mono uppercase tracking-[0.25em]`}
                      placeholder="e.g. ABCD-1234-EFGH"
                      value={student.enrollmentCode}
                      onChange={(event) => {
                        setEnrollmentPreview(null);
                        setField("enrollmentCode", event.target.value.toUpperCase());
                      }}
                    />
                    <button
                      type="button"
                      onClick={validateEnrollmentCode}
                      disabled={isValidatingCode || !student.enrollmentCode.trim()}
                      className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/15 disabled:opacity-50"
                    >
                      {isValidatingCode ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Validating
                        </span>
                      ) : (
                        "Validate code"
                      )}
                    </button>
                  </div>
                </Field>

                {enrollmentPreview ? (
                  <div className="grid gap-4 rounded-[28px] border border-emerald-400/20 bg-emerald-500/10 p-5 md:grid-cols-4">
                    <PreviewTile label="Department" value={enrollmentPreview.department?.name || "Unavailable"} />
                    <PreviewTile label="Batch" value={enrollmentPreview.batch?.label || "Unavailable"} />
                    <PreviewTile label="Semester" value={String(enrollmentPreview.semester || "Unavailable")} />
                    <PreviewTile label="Section" value={enrollmentPreview.section || "TBD"} />
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-amber-300/20 bg-black/25 p-6 text-sm leading-6 text-zinc-400">
                    Validate the enrollment code to fetch the real department, batch, semester, and section before you can continue.
                  </div>
                )}
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-6">
                <div className="rounded-[28px] border border-white/8 bg-black/30 p-5">
                  <p className="text-sm font-medium text-white">Batch-linked subject catalogue</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    These subjects are loaded from the batch mapping created in Step 2. At least one subject is required.
                  </p>
                </div>

                {isLoadingSubjects ? (
                  <div className="flex items-center gap-3 rounded-[28px] border border-amber-300/15 bg-amber-300/10 p-5 text-sm text-amber-100">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading subjects for your batch
                  </div>
                ) : null}

                {!isLoadingSubjects && !subjectOptions.length ? (
                  <div className="rounded-[28px] border border-amber-300/20 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
                    <p className="font-medium">No subjects available</p>
                    <p className="mt-1 text-amber-200/70">
                      We couldn&apos;t load subjects for your batch. This may be because:
                    </p>
                    <ul className="mt-2 list-disc list-inside text-amber-200/70 space-y-1">
                      <li>Your batch is still being configured</li>
                      <li>Subjects haven&apos;t been assigned to your department yet</li>
                      <li>There may be a temporary connection issue</li>
                    </ul>
                    <p className="mt-3 text-amber-200/70">
                      You can still continue onboarding and select subjects later, or contact your administrator if this persists.
                    </p>
                  </div>
                ) : null}

                {!isLoadingSubjects && !!subjectOptions.length ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {subjectOptions.map((subject) => {
                      const checked = student.selectedSubjectIds.includes(subject.id);
                      return (
                        <button
                          key={subject.id}
                          type="button"
                          onClick={() => toggleSubject(subject.id)}
                          className={`rounded-[28px] border p-5 text-left transition ${
                            checked
                              ? "border-amber-300/50 bg-amber-300/10"
                              : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-white">{subject.name}</p>
                              <p className="mt-1 text-xs uppercase tracking-[0.25em] text-amber-200/70">
                                {subject.code || "No code"} {subject.type ? `• ${subject.type}` : ""}
                              </p>
                            </div>
                            <div
                              className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                                checked ? "border-amber-300 bg-amber-300 text-black" : "border-white/15 text-transparent"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>
                          <p className="mt-4 text-sm leading-6 text-zinc-400">
                            {subject.description || "No subject description has been configured yet."}
                          </p>
                          <div className="mt-4 flex gap-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
                            <span>{subject.credits || "NA"} credits</span>
                            <span>Semester {subject.semester || student.semester || "NA"}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {errors.subjectIds ? <p className="text-sm text-red-300">{errors.subjectIds}</p> : null}
              </div>
            ) : null}

            {currentStep === 4 ? (
              <div className="grid gap-5 md:grid-cols-2">
                <Field
                  label="Emergency Contact"
                  helper="Required. Used for urgent outreach and escalation."
                  error={errors.emergencyContact}
                >
                  <input
                    className={baseInputClass}
                    placeholder="+91 9876543210"
                    value={student.emergencyContact}
                    onChange={(event) => setField("emergencyContact", event.target.value)}
                  />
                </Field>
                <Field
                  label="Parent Email"
                  helper="Optional, but must be valid when provided."
                  error={errors.parentEmail}
                >
                  <input
                    className={baseInputClass}
                    placeholder="parent@example.com"
                    value={student.parentEmail}
                    onChange={(event) => setField("parentEmail", event.target.value)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field
                    label="Profile Photo"
                    helper="Upload a JPG, PNG, or WEBP image. URLs are not accepted."
                    error={errors.profilePhoto}
                  >
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed border-amber-300/25 bg-black/25 px-6 py-10 text-center transition hover:border-amber-300/45 hover:bg-black/35">
                      <ImagePlus className="h-8 w-8 text-amber-200" />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {student.profilePhotoFile ? student.profilePhotoFile.name : "Choose profile photo"}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">Max size 5 MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setField("profilePhotoFile", file);
                        }}
                      />
                    </label>
                    {student.existingProfilePhotoUrl ? (
                      <p className="mt-3 text-xs text-zinc-500">Existing photo found. Uploading a new file will replace it.</p>
                    ) : null}
                  </Field>
                </div>
              </div>
            ) : null}

            {!showAdaptiveCalibration && currentStep === 5 ? (
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/70">Learning style</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {LEARNING_STYLE_OPTIONS.map((option) => {
                      const selected = student.learningStyles.includes(option.value);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => toggleLearningStyle(option.value)}
                          className={`rounded-[28px] border p-5 text-left transition ${
                            selected
                              ? "border-amber-300/50 bg-amber-300/10"
                              : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-base font-semibold text-white">{option.label}</p>
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                                selected ? "border-amber-300 bg-amber-300 text-black" : "border-white/15 text-transparent"
                              }`}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-zinc-400">{option.helper}</p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.learningStyles ? <p className="mt-3 text-sm text-red-300">{errors.learningStyles}</p> : null}
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200/70">Self assessment</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {SELF_ASSESSMENT_OPTIONS.map((option) => {
                      const selected = student.selfAssessment === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setField("selfAssessment", option.value)}
                          className={`rounded-[28px] border p-5 text-left transition ${
                            selected
                              ? "border-amber-300/50 bg-amber-300/10"
                              : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                          }`}
                        >
                          <p className="text-base font-semibold text-white">{option.label}</p>
                          <p className="mt-3 text-sm leading-6 text-zinc-400">{option.helper}</p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.selfAssessment ? <p className="mt-3 text-sm text-red-300">{errors.selfAssessment}</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          {!showAdaptiveCalibration ? (
            <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                disabled={currentStep === 1 || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-45"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={submitCurrentStep}
                disabled={isSubmitting || (currentStep === 3 && !subjectOptions.length)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#facc15,#fde68a)] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-45"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {currentStep === 5 ? "Complete onboarding" : "Save and continue"}
                {isSubmitting ? null : <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  helper,
  error,
  children,
}: {
  label: string;
  helper: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-white">{label}</span>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{helper}</p>
      <div className="mt-3">{children}</div>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </label>
  );
}

function PreviewTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/35 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
