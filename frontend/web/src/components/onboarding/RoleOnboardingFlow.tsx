"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { getRoleHome } from "@/lib/role-routing";
import {
  fieldErrors,
  getRoleOnboardingConfig,
  parseListInput,
  type OnboardingField,
  type SupportedRoleOnboardingRole,
  type SupportedRoleStep,
  validateRoleStep,
} from "@/lib/role-onboarding";
import { useOnboardingStore } from "@/store/useOnboardingStore";

const baseInputClass =
  "w-full rounded-2xl border border-amber-200/10 bg-zinc-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300 focus:ring-2 focus:ring-amber-300/20 placeholder:text-zinc-500";

const cardClass =
  "rounded-[28px] border border-amber-200/10 bg-[linear-gradient(180deg,rgba(255,214,10,0.08),rgba(10,10,10,0.96)_22%,rgba(10,10,10,0.98))] shadow-[0_25px_100px_rgba(0,0,0,0.45)]";

type RoleOnboardingFlowProps = {
  role: SupportedRoleOnboardingRole;
};

export default function RoleOnboardingFlow({ role }: RoleOnboardingFlowProps) {
  const router = useRouter();
  const saveSnapshot = useOnboardingStore((state) => state.saveSnapshot);
  const clearSnapshot = useOnboardingStore((state) => state.clearSnapshot);
  const config = useMemo(() => getRoleOnboardingConfig(role), [role]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<SupportedRoleStep>(1);
  const [completedStep, setCompletedStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, any>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const totalSteps = config.steps.length;

  useEffect(() => {
    const init = async () => {
      try {
        const draft = useOnboardingStore.getState().snapshots[role] || {};
        const user = await api.getCurrentUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setCurrentUser(user);

        const status = await api.getOnboardingStatus();
        if (status.role !== role) {
          router.push(getRoleHome(user.role));
          return;
        }
        if (status.isComplete || Number(status.step || 0) >= 5) {
          clearSnapshot(role);
          router.push(getRoleHome(role));
          return;
        }

        const progress = status.progress || {};
        const mergedValues: Record<string, any> = {
          fullName: user.name || "",
          ...draft.values,
        };
        for (let step = 1; step <= totalSteps; step += 1) {
          Object.assign(mergedValues, progress[`step_${step}`] || {});
        }

        setValues(mergedValues);
        setCompletedStep(Math.min(totalSteps, Number(status.step || 0)));
        setCurrentStep((draft.currentStep as SupportedRoleStep) || (Math.min(totalSteps, Math.max(1, Number(status.step || 0) + 1)) as SupportedRoleStep));
      } catch (error: any) {
        const message = error?.message || "Failed to load onboarding";
        setPageError(message);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [clearSnapshot, role, router, totalSteps]);

  useEffect(() => {
    if (isLoading) {
      return;
    }
    saveSnapshot(role, { currentStep, completedStep, values });
  }, [completedStep, currentStep, isLoading, role, saveSnapshot, values]);

  const progressWidth = `${Math.max(20, (completedStep / totalSteps) * 100)}%`;
  const activeStep = config.steps[currentStep - 1];

  const setField = (key: string, value: any) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setPageError(null);
    setSuccessMessage(null);
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
      const result = validateRoleStep(role, currentStep, values);
      if (!result.success) {
        setErrors(fieldErrors(result as any) as Record<string, string>);
        return;
      }

      console.log(`[ONBOARDING DEBUG] Submitting Step ${currentStep} for role: ${role}`, { data: result.data });
      let response;
      
      if (role === 'parent' && currentStep === 1) {
        // Use the specialized parent onboarding endpoint as requested
        response = await api.updateParentOnboarding({
          fullName: result.data.fullName,
          relationship: result.data.relationship,
          user_id: currentUser?.id || ""
        });
      } else if (role === 'parent' && currentStep === 2) {
        // Step 2 for parents is now linking a student
        response = await api.parentLinkStudentByCode(result.data.studentCode);
      } else {
        response = await api.updateOnboardingStep(currentStep, result.data);
      }

      console.log(`[ONBOARDING DEBUG] API Response for Step ${currentStep}:`, response);

      if (response && response.success === false) {
        throw new Error(response.error || response.detail || "Failed to save step progress");
      }

      if (currentStep === totalSteps) {
        console.log(`[ONBOARDING DEBUG] Final step completed. Redirection to ${getRoleHome(role)}`);
        await api.completeOnboarding();
        clearSnapshot(role);
        toast.success(`${config.label} completed`);
        window.location.href = getRoleHome(role);
        return;
      }

      setCompletedStep((prev) => Math.max(prev, currentStep));
      setCurrentStep((prev) => (prev + 1) as SupportedRoleStep);
      setSuccessMessage(`${activeStep.title} saved successfully.`);
      toast.success(`Step ${currentStep} saved`);
    } catch (error: any) {
      console.error(`[ONBOARDING ERROR] Step ${currentStep} failed:`, error);
      // Handle various error formats from API
      const apiMessage = error?.response?.data?.detail || error?.response?.data?.error || error?.detail || error?.message;
      const message = apiMessage || "Something went wrong";
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
            Preparing onboarding workspace
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className={`${cardClass} h-fit p-6`}>
          <div className="rounded-3xl border border-amber-300/15 bg-amber-300/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">{config.label}</p>
            <h1 className="mt-3 text-2xl font-semibold text-white">Complete your role-aware setup.</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{config.intro}</p>
          </div>

          <div className="mt-6 rounded-3xl border border-white/8 bg-black/40 p-5">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-zinc-500">
              <span>Completion</span>
              <span>{completedStep}/{totalSteps}</span>
            </div>
            <div className="mt-3 h-3 rounded-full bg-white/5">
              <div className="h-3 rounded-full bg-[linear-gradient(90deg,#facc15,#fde68a)] transition-all" style={{ width: progressWidth }} />
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {config.steps.map((step) => {
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
                    isActive
                      ? "border-amber-300/40 bg-amber-300/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
                  } ${!isUnlocked ? "cursor-not-allowed opacity-45" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isDone ? "bg-amber-300 text-black" : "bg-white/8 text-amber-200"}`}>
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
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
        </aside>

        <main className={`${cardClass} p-6 sm:p-8`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">Step {currentStep}</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">{activeStep.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-300">{activeStep.description}</p>
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

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {activeStep.fields.map((field) => (
              <div
                key={field.key}
                className={
                  field.type === "textarea" || field.type === "array" || field.type === "multiselect"
                    ? "md:col-span-2"
                    : ""
                }
              >
                {field.type === "boolean" ? (
                  <div>
                    {renderField(field, values[field.key], setField)}
                    {errors[field.key] ? <p className="mt-2 text-sm text-red-300">{errors[field.key]}</p> : null}
                  </div>
                ) : (
                  <Field label={field.label} helper={field.helper} error={errors[field.key]}>
                    {renderField(field, values[field.key], setField)}
                  </Field>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1) as SupportedRoleStep)}
              disabled={currentStep === 1 || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/5 disabled:opacity-45"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={submitCurrentStep}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#facc15,#fde68a)] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:opacity-45"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {currentStep === totalSteps ? config.completionLabel : "Save and continue"}
              {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

function renderField(
  field: OnboardingField,
  value: any,
  setField: (key: string, value: any) => void,
) {
  if (field.type === "textarea") {
    return (
      <textarea
        className={`${baseInputClass} min-h-[140px]`}
        value={value || ""}
        placeholder={field.placeholder}
        onChange={(event) => setField(field.key, event.target.value)}
      />
    );
  }

  if (field.type === "array") {
    return (
      <div className="space-y-3">
        <textarea
          className={`${baseInputClass} min-h-[140px]`}
          value={Array.isArray(value) ? value.join("\n") : value || ""}
          placeholder={field.placeholder}
          onChange={(event) => setField(field.key, parseListInput(event.target.value))}
        />
        <p className="text-xs leading-5 text-zinc-500">Use one item per line. Commas also work.</p>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <select className={baseInputClass} value={value || ""} onChange={(event) => setField(field.key, event.target.value)}>
        <option value="">Select an option</option>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "multiselect") {
    const currentValues = new Set(Array.isArray(value) ? value : []);
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {(field.options || []).map((option) => {
          const selected = currentValues.has(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                if (selected) {
                  currentValues.delete(option.value);
                } else {
                  currentValues.add(option.value);
                }
                setField(field.key, Array.from(currentValues));
              }}
              className={`rounded-[28px] border p-5 text-left transition ${
                selected
                  ? "border-amber-300/50 bg-amber-300/10"
                  : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.06]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-semibold text-white">{option.label}</p>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-amber-300 bg-amber-300 text-black" : "border-white/15 text-transparent"}`}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              {option.helper ? <p className="mt-3 text-sm leading-6 text-zinc-400">{option.helper}</p> : null}
            </button>
          );
        })}
      </div>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-[28px] border border-white/8 bg-black/30 p-5 transition hover:border-white/15">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-white/20 bg-transparent accent-amber-300"
          checked={Boolean(value)}
          onChange={(event) => setField(field.key, event.target.checked)}
        />
        <div>
          <p className="text-sm font-semibold text-white">{field.label}</p>
          {field.helper ? <p className="mt-1 text-xs leading-5 text-zinc-500">{field.helper}</p> : null}
        </div>
      </label>
    );
  }

  return (
    <input
      className={baseInputClass}
      type={field.type === "number" ? "number" : "text"}
      value={value ?? ""}
      placeholder={field.placeholder}
      onChange={(event) => setField(field.key, field.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)}
    />
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
