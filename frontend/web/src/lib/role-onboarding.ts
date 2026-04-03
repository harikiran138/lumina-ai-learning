import { z } from "zod";

export type SupportedRoleOnboardingRole =
  | "teacher"
  | "faculty"
  | "parent"
  | "mentor"
  | "peer_tutor"
  | "researcher";

export type SupportedRoleStep = 1 | 2 | 3 | 4 | 5;

type FieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "array"
  | "boolean";

interface StepField {
  key: string;
  type: FieldType;
  label: string;
  helper: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string; helper?: string }>;
}

interface OnboardingStep {
  id: SupportedRoleStep;
  title: string;
  description: string;
  fields: StepField[];
  schema: z.ZodTypeAny;
}

interface RoleOnboardingConfig {
  label: string;
  intro: string;
  completionLabel: string;
  steps: OnboardingStep[];
}

// ─── Shared utilities ────────────────────────────────────────────────────────

export function parseListInput(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function fieldErrors<T extends Record<string, unknown>>(
  result: z.ZodSafeParseResult<T>,
) {
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

// ─── Schemas ─────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  bio: z.string().trim().optional(),
  phoneNumber: z.string().trim().optional(),
});

const qualificationsSchema = z.object({
  highestDegree: z.string().trim().min(1, "Highest degree is required"),
  institution: z.string().trim().min(1, "Institution is required"),
  yearsOfExperience: z.string().trim().optional(),
});

const subjectsSchema = z.object({
  subjects: z.array(z.string()).min(1, "Add at least one subject"),
  teachingStyles: z.array(z.string()).optional(),
});

const preferencesSchema = z.object({
  availability: z.string().trim().optional(),
  preferredGradeLevels: z.array(z.string()).optional(),
});

const confirmationSchema = z.object({
  agreeToTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
});

const researchSchema = z.object({
  researchAreas: z.array(z.string()).min(1, "Add at least one research area"),
  publications: z.string().trim().optional(),
});

const parentProfileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters"),
  relationship: z.string().trim().min(1, "Relationship is required"),
  phoneNumber: z.string().trim().min(1, "Phone number is required"),
});

const parentChildSchema = z.object({
  childName: z.string().trim().min(2, "Child name must be at least 2 characters"),
  childEnrollmentCode: z.string().trim().min(4, "Enrollment code is required"),
});

const mentorExpertiseSchema = z.object({
  expertiseAreas: z.array(z.string()).min(1, "Add at least one area of expertise"),
  mentorshipStyle: z.string().trim().optional(),
});

const peerTutorSkillsSchema = z.object({
  tutorSubjects: z.array(z.string()).min(1, "Add at least one subject"),
  gradeLevel: z.string().trim().optional(),
});

// ─── Step schemas per role and step ─────────────────────────────────────────

type RoleStepSchemas = Record<number, z.ZodTypeAny>;

const ROLE_STEP_SCHEMAS: Record<SupportedRoleOnboardingRole, RoleStepSchemas> = {
  teacher: {
    1: profileSchema,
    2: qualificationsSchema,
    3: subjectsSchema,
    4: preferencesSchema,
    5: confirmationSchema,
  },
  faculty: {
    1: profileSchema,
    2: qualificationsSchema,
    3: subjectsSchema,
    4: preferencesSchema,
    5: confirmationSchema,
  },
  parent: {
    1: parentProfileSchema,
    2: parentChildSchema,
    3: preferencesSchema,
    4: confirmationSchema,
  },
  mentor: {
    1: profileSchema,
    2: mentorExpertiseSchema,
    3: preferencesSchema,
    4: confirmationSchema,
  },
  peer_tutor: {
    1: profileSchema,
    2: peerTutorSkillsSchema,
    3: preferencesSchema,
    4: confirmationSchema,
  },
  researcher: {
    1: profileSchema,
    2: qualificationsSchema,
    3: researchSchema,
    4: preferencesSchema,
    5: confirmationSchema,
  },
};

// ─── Config definitions ───────────────────────────────────────────────────────

const TEACHER_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Personal Profile",
    description: "Set up your basic profile information so your institution can identify you.",
    schema: profileSchema,
    fields: [
      { key: "fullName", type: "text", label: "Full Name", helper: "Your legal name as it appears on official documents", placeholder: "Dr. Jane Smith" },
      { key: "bio", type: "textarea", label: "Short Bio", helper: "A brief introduction to display on your profile", placeholder: "Experienced educator passionate about…" },
      { key: "phoneNumber", type: "text", label: "Phone Number", helper: "Your contact number for institution communications" },
    ],
  },
  {
    id: 2,
    title: "Qualifications",
    description: "Tell us about your educational background and years of experience.",
    schema: qualificationsSchema,
    fields: [
      { key: "highestDegree", type: "select", label: "Highest Degree", helper: "Your highest academic qualification", options: [{ label: "Bachelor's", value: "bachelors" }, { label: "Master's", value: "masters" }, { label: "Doctorate (Ph.D.)", value: "phd" }, { label: "Other", value: "other" }] },
      { key: "institution", type: "text", label: "Awarding Institution", helper: "Where you completed your highest degree", placeholder: "University of…" },
      { key: "yearsOfExperience", type: "number", label: "Years of Teaching Experience", helper: "Total years in classroom or institutional settings", placeholder: "5" },
    ],
  },
  {
    id: 3,
    title: "Subjects & Style",
    description: "List the subjects you teach and your preferred teaching approaches.",
    schema: subjectsSchema,
    fields: [
      { key: "subjects", type: "array", label: "Subjects You Teach", helper: "Enter one subject per line, e.g. Mathematics", placeholder: "Mathematics\nPhysics\nChemistry" },
      {
        key: "teachingStyles",
        type: "multiselect",
        label: "Teaching Styles",
        helper: "Select all that apply to your instructional approach",
        options: [
          { label: "Lecture-based", value: "lecture", helper: "Structured presentations and demonstrations" },
          { label: "Inquiry-based", value: "inquiry", helper: "Students explore questions and problems" },
          { label: "Collaborative", value: "collaborative", helper: "Group work and peer learning" },
          { label: "Project-based", value: "project", helper: "Extended real-world projects" },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Availability & Preferences",
    description: "Share your scheduling preferences and preferred grade levels.",
    schema: preferencesSchema,
    fields: [
      { key: "availability", type: "select", label: "Availability", helper: "Your general availability for classes", options: [{ label: "Full-time", value: "full_time" }, { label: "Part-time", value: "part_time" }, { label: "Weekends only", value: "weekends" }] },
      { key: "preferredGradeLevels", type: "multiselect", label: "Preferred Grade Levels", helper: "The grade ranges you are most comfortable teaching", options: [{ label: "Primary (1–5)", value: "primary" }, { label: "Middle School (6–8)", value: "middle" }, { label: "High School (9–12)", value: "high" }, { label: "Undergraduate", value: "undergrad" }, { label: "Postgraduate", value: "postgrad" }] },
    ],
  },
  {
    id: 5,
    title: "Confirmation",
    description: "Review your information and confirm you agree to the platform terms.",
    schema: confirmationSchema,
    fields: [
      { key: "agreeToTerms", type: "boolean", label: "Terms Agreement", helper: "I agree to the Lumina platform terms and educator code of conduct." },
    ],
  },
];

const RESEARCHER_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Personal Profile",
    description: "Set up your researcher profile.",
    schema: profileSchema,
    fields: [
      { key: "fullName", type: "text", label: "Full Name", helper: "Your name as it will appear in publications and profiles", placeholder: "Dr. Jane Smith" },
      { key: "bio", type: "textarea", label: "Research Bio", helper: "Brief overview of your research background", placeholder: "Researcher specializing in…" },
      { key: "phoneNumber", type: "text", label: "Phone Number", helper: "Contact number for institutional communications" },
    ],
  },
  {
    id: 2,
    title: "Qualifications",
    description: "Tell us about your academic background.",
    schema: qualificationsSchema,
    fields: [
      { key: "highestDegree", type: "select", label: "Highest Degree", helper: "Your highest academic qualification", options: [{ label: "Master's", value: "masters" }, { label: "Doctorate (Ph.D.)", value: "phd" }, { label: "Post-Doctoral", value: "postdoc" }, { label: "Other", value: "other" }] },
      { key: "institution", type: "text", label: "Awarding Institution", helper: "Where you completed your highest degree", placeholder: "University of…" },
      { key: "yearsOfExperience", type: "number", label: "Years of Research Experience", helper: "Total years in active research roles", placeholder: "3" },
    ],
  },
  {
    id: 3,
    title: "Research Areas",
    description: "Describe your research focus and publication record.",
    schema: researchSchema,
    fields: [
      { key: "researchAreas", type: "array", label: "Research Areas", helper: "Enter one area per line or comma-separated", placeholder: "Machine Learning\nNatural Language Processing" },
      { key: "publications", type: "textarea", label: "Key Publications (optional)", helper: "List titles or DOIs for your most relevant publications", placeholder: "Title, Journal, Year…" },
    ],
  },
  {
    id: 4,
    title: "Preferences",
    description: "Share your collaboration and availability preferences.",
    schema: preferencesSchema,
    fields: [
      { key: "availability", type: "select", label: "Availability", helper: "Your general availability for collaboration", options: [{ label: "Full-time", value: "full_time" }, { label: "Part-time", value: "part_time" }, { label: "Consulting only", value: "consulting" }] },
    ],
  },
  {
    id: 5,
    title: "Confirmation",
    description: "Review your profile and agree to platform terms.",
    schema: confirmationSchema,
    fields: [
      { key: "agreeToTerms", type: "boolean", label: "Terms Agreement", helper: "I agree to the Lumina platform terms and researcher code of conduct." },
    ],
  },
];

const PARENT_STEPS: OnboardingStep[] = [
  {
    id: 1 as SupportedRoleStep,
    title: "Guardian Profile",
    description: "Enter your contact information and relationship to the student.",
    schema: parentProfileSchema,
    fields: [
      { key: "fullName", type: "text", label: "Full Name", helper: "Your legal name", placeholder: "Jane Smith" },
      { key: "relationship", type: "select", label: "Relationship to Student", helper: "Your relationship to the enrolled student", options: [{ label: "Parent", value: "parent" }, { label: "Guardian", value: "guardian" }, { label: "Grandparent", value: "grandparent" }, { label: "Other", value: "other" }] },
      { key: "phoneNumber", type: "text", label: "Phone Number", helper: "Your primary contact number", placeholder: "+1 555 000 0000" },
    ],
  },
  {
    id: 2 as SupportedRoleStep,
    title: "Student Linkage",
    description: "Link your account to your child's student profile using their enrollment code.",
    schema: parentChildSchema,
    fields: [
      { key: "childName", type: "text", label: "Child's Full Name", helper: "The student's name as registered in the system", placeholder: "Alex Smith" },
      { key: "childEnrollmentCode", type: "text", label: "Enrollment Code", helper: "The 4-digit or longer code provided by the institution", placeholder: "STU-XXXX" },
    ],
  },
  {
    id: 3 as SupportedRoleStep,
    title: "Communication Preferences",
    description: "Tell us how you prefer to receive updates about your child's progress.",
    schema: preferencesSchema,
    fields: [
      { key: "availability", type: "select", label: "Best Time to Contact", helper: "When you are generally available for calls or messages", options: [{ label: "Morning", value: "morning" }, { label: "Afternoon", value: "afternoon" }, { label: "Evening", value: "evening" }] },
    ],
  },
  {
    id: 4 as SupportedRoleStep,
    title: "Confirmation",
    description: "Review your information and agree to the platform terms.",
    schema: confirmationSchema,
    fields: [
      { key: "agreeToTerms", type: "boolean", label: "Terms Agreement", helper: "I agree to the Lumina platform terms and guardian usage policy." },
    ],
  },
];

const MENTOR_STEPS: OnboardingStep[] = [
  {
    id: 1 as SupportedRoleStep,
    title: "Mentor Profile",
    description: "Set up your mentor profile so students can find and connect with you.",
    schema: profileSchema,
    fields: [
      { key: "fullName", type: "text", label: "Full Name", helper: "Your name as it will appear to mentees", placeholder: "Jane Smith" },
      { key: "bio", type: "textarea", label: "Mentor Bio", helper: "Describe your background and what you offer as a mentor", placeholder: "I am a professional with 10 years of experience in…" },
      { key: "phoneNumber", type: "text", label: "Phone Number", helper: "Optional contact number" },
    ],
  },
  {
    id: 2 as SupportedRoleStep,
    title: "Expertise & Style",
    description: "Share your areas of expertise and mentorship approach.",
    schema: mentorExpertiseSchema,
    fields: [
      { key: "expertiseAreas", type: "array", label: "Areas of Expertise", helper: "List the fields where you can guide students", placeholder: "Career planning\nResume writing\nInterview preparation" },
      { key: "mentorshipStyle", type: "select", label: "Mentorship Style", helper: "Your preferred way of working with mentees", options: [{ label: "Goal-oriented", value: "goal_oriented" }, { label: "Advisory", value: "advisory" }, { label: "Coaching", value: "coaching" }, { label: "Peer-level", value: "peer" }] },
    ],
  },
  {
    id: 3 as SupportedRoleStep,
    title: "Availability",
    description: "Let students know when you are available for mentorship sessions.",
    schema: preferencesSchema,
    fields: [
      { key: "availability", type: "select", label: "Weekly Availability", helper: "Estimated time per week available for mentoring", options: [{ label: "1–2 hours", value: "low" }, { label: "3–5 hours", value: "medium" }, { label: "5+ hours", value: "high" }] },
    ],
  },
  {
    id: 4 as SupportedRoleStep,
    title: "Confirmation",
    description: "Review your mentor profile and agree to the platform terms.",
    schema: confirmationSchema,
    fields: [
      { key: "agreeToTerms", type: "boolean", label: "Terms Agreement", helper: "I agree to the Lumina platform terms and mentor code of conduct." },
    ],
  },
];

const PEER_TUTOR_STEPS: OnboardingStep[] = [
  {
    id: 1 as SupportedRoleStep,
    title: "Tutor Profile",
    description: "Set up your peer tutor profile.",
    schema: profileSchema,
    fields: [
      { key: "fullName", type: "text", label: "Full Name", helper: "Your name as it will appear to students", placeholder: "Alex Smith" },
      { key: "bio", type: "textarea", label: "Tutor Bio", helper: "Brief description of your academic strengths and tutoring style", placeholder: "Strong in STEM subjects, enjoy explaining concepts clearly…" },
      { key: "phoneNumber", type: "text", label: "Phone Number", helper: "Optional contact number" },
    ],
  },
  {
    id: 2 as SupportedRoleStep,
    title: "Tutor Subjects",
    description: "Tell us which subjects you can tutor and your current grade level.",
    schema: peerTutorSkillsSchema,
    fields: [
      { key: "tutorSubjects", type: "array", label: "Subjects You Can Tutor", helper: "List each subject on a new line", placeholder: "Mathematics\nPhysics\nEnglish" },
      { key: "gradeLevel", type: "select", label: "Your Current Grade / Year", helper: "Your current year of study", options: [{ label: "Year 9–10", value: "year_9_10" }, { label: "Year 11–12", value: "year_11_12" }, { label: "1st Year University", value: "uni_1" }, { label: "2nd Year University", value: "uni_2" }, { label: "3rd Year+ University", value: "uni_3" }] },
    ],
  },
  {
    id: 3 as SupportedRoleStep,
    title: "Availability",
    description: "Tell us when you are available for tutoring sessions.",
    schema: preferencesSchema,
    fields: [
      { key: "availability", type: "select", label: "Weekly Availability", helper: "How many hours per week can you tutor?", options: [{ label: "1–2 hours", value: "low" }, { label: "3–5 hours", value: "medium" }, { label: "5+ hours", value: "high" }] },
    ],
  },
  {
    id: 4 as SupportedRoleStep,
    title: "Confirmation",
    description: "Review your tutor profile and agree to platform terms.",
    schema: confirmationSchema,
    fields: [
      { key: "agreeToTerms", type: "boolean", label: "Terms Agreement", helper: "I agree to the Lumina platform terms and peer tutor code of conduct." },
    ],
  },
];

// ─── Config map ───────────────────────────────────────────────────────────────

const ROLE_CONFIGS: Record<SupportedRoleOnboardingRole, RoleOnboardingConfig> = {
  teacher: {
    label: "Teacher Onboarding",
    intro:
      "Complete these steps to activate your teacher profile. Your institution needs accurate subject and qualification data to assign you courses and students.",
    completionLabel: "Finish Teacher Setup",
    steps: TEACHER_STEPS,
  },
  faculty: {
    label: "Faculty Onboarding",
    intro:
      "Set up your faculty profile to unlock course creation, student management, and AI-assisted grading tools.",
    completionLabel: "Finish Faculty Setup",
    steps: TEACHER_STEPS,
  },
  parent: {
    label: "Guardian Onboarding",
    intro:
      "Link your account to your child's learning journey and configure your communication preferences.",
    completionLabel: "Finish Guardian Setup",
    steps: PARENT_STEPS,
  },
  mentor: {
    label: "Mentor Onboarding",
    intro:
      "Share your expertise and availability so students can request mentorship sessions tailored to their goals.",
    completionLabel: "Finish Mentor Setup",
    steps: MENTOR_STEPS,
  },
  peer_tutor: {
    label: "Peer Tutor Onboarding",
    intro:
      "Set up your peer tutor profile to start helping fellow students with the subjects you excel at.",
    completionLabel: "Finish Tutor Setup",
    steps: PEER_TUTOR_STEPS,
  },
  researcher: {
    label: "Researcher Onboarding",
    intro:
      "Configure your researcher profile to collaborate on institutional research projects and AI-powered studies.",
    completionLabel: "Finish Researcher Setup",
    steps: RESEARCHER_STEPS,
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getRoleOnboardingConfig(
  role: SupportedRoleOnboardingRole,
): RoleOnboardingConfig {
  return ROLE_CONFIGS[role];
}

export function validateRoleStep(
  role: SupportedRoleOnboardingRole,
  step: number,
  values: Record<string, unknown>,
): z.ZodSafeParseResult<Record<string, unknown>> {
  const schemas = ROLE_STEP_SCHEMAS[role];
  const schema = schemas?.[step];
  if (!schema) {
    return { success: true, data: values } as z.ZodSafeParseResult<Record<string, unknown>>;
  }
  return schema.safeParse(values) as z.ZodSafeParseResult<Record<string, unknown>>;
}
