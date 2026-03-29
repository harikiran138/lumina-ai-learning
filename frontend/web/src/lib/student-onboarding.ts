import { z } from "zod";

const phoneRefinement = (value: string) => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
};

export const studentPersonalSchema = z.object({
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().trim().min(1, "Date of birth is required"),
  gender: z.string().trim().optional(),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .refine(phoneRefinement, "Phone number must be between 8 and 15 digits"),
  email: z.string().trim().email("Email is invalid"),
});

export const studentEnrollmentSchema = z.object({
  enrollmentCode: z.string().trim().min(4, "Enrollment code is required"),
});

export const studentSubjectsSchema = z.object({
  subjectIds: z.array(z.string()).min(1, "Select at least one subject"),
});

export const studentProfileSchema = z.object({
  emergencyContact: z
    .string()
    .trim()
    .min(1, "Emergency contact is required")
    .refine(phoneRefinement, "Emergency contact must be between 8 and 15 digits"),
  parentEmail: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().email().safeParse(value).success, "Parent email is invalid"),
});

export const studentPreferencesSchema = z.object({
  learningStyles: z.array(z.string()).min(1, "Select at least one learning preference"),
  selfAssessment: z.enum(["beginner", "intermediate", "advanced"], {
    error: "Select your current level",
  }),
});

export type StudentPersonalValues = z.infer<typeof studentPersonalSchema>;
export type StudentProfileValues = z.infer<typeof studentProfileSchema>;
export type StudentPreferencesValues = z.infer<typeof studentPreferencesSchema>;

export function fieldErrors<T extends Record<string, unknown>>(result: z.ZodSafeParseResult<T>) {
  if (result.success) {
    return {} as Partial<Record<keyof T, string>>;
  }

  const next: Partial<Record<keyof T, string>> = {};
  for (const issue of result.error.issues) {
    const path = issue.path[0] as keyof T | undefined;
    if (path && !next[path]) {
      next[path] = issue.message;
    }
  }
  return next;
}
