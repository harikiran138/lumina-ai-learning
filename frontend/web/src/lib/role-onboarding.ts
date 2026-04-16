import { Role } from './rbac/roles';

export type SupportedRoleOnboardingRole = 
  | Role.FACULTY
  | Role.HOD
  | Role.ADMIN
  | Role.SUPER_ADMIN
  | Role.PARENT
  | Role.COUNSELOR
  | Role.PEER_MENTOR
  | Role.ALUMNI;

export type SupportedRoleStep = 1 | 2 | 3 | 4 | 5;

export interface OnboardingField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "multiselect" | "array" | "boolean";
  helper: string;
  placeholder?: string;
  options?: Array<{ label: string; value: string; helper?: string }>;
  required?: boolean;
}

export interface RoleStep {
  id: SupportedRoleStep;
  title: string;
  description: string;
  fields: OnboardingField[];
}

export interface RoleOnboardingConfig {
  label: string;
  intro: string;
  completionLabel: string;
  steps: RoleStep[];
}

const CONFIGS: Record<SupportedRoleOnboardingRole, RoleOnboardingConfig> = {
  [Role.FACULTY]: {
    label: "Faculty Onboarding",
    intro: "Complete your educator profile to manage classes and students on Lumina.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Official Details",
        description: "Institutional credentials",
        fields: [
          { key: "fullName", label: "Full Name", type: "text", helper: "Your full name.", placeholder: "Jane Doe", required: true },
          { key: "employeeId", label: "Employee ID", type: "text", helper: "Institutional ID.", placeholder: "FAC-1024", required: true },
          { key: "department", label: "Department", type: "text", helper: "Department name.", placeholder: "Computer Science", required: true },
        ],
      },
      {
        id: 2,
        title: "Teaching Areas",
        description: "Specify subjects and syllabus",
        fields: [
          { key: "subjects", label: "Subjects Taught", type: "array", helper: "Subjects you are responsible for, one per line.", placeholder: "Data Structures\nAlgorithms", required: true },
          { key: "hasSyllabus", label: "I have my syllabus ready for upload", type: "boolean", helper: "Confirming you have syllabus files to upload in the next step." },
        ],
      },
    ],
  },

  [Role.HOD]: {
    label: "HOD Onboarding",
    intro: "Set up your department leadership profile.",
    completionLabel: "Access Dashboard",
    steps: [
      {
        id: 1,
        title: "Department Leadership",
        description: "Define your scope of control",
        fields: [
          { key: "departmentName", label: "Department Name", type: "text", helper: "Name of the department you lead.", placeholder: "Electronics & Communication", required: true },
          { key: "facultyMapping", label: "Faculty Mapping", type: "boolean", helper: "Enable automatic faculty-to-course mapping recommendations." },
        ],
      },
    ],
  },

  [Role.ADMIN]: {
    label: "Admin Onboarding",
    intro: "Initialize your institution's digital ecosystem.",
    completionLabel: "Go to Admin Center",
    steps: [
      {
        id: 1,
        title: "Institution Setup",
        description: "Basic institutional metadata",
        fields: [
          { key: "institutionName", label: "Institution Name", type: "text", helper: "Official name.", placeholder: "Lumina Institute of Tech", required: true },
          { key: "departmentsList", label: "Departments", type: "array", helper: "Comma or newline separated list of departments.", placeholder: "CSE, ECE, MECH", required: true },
        ],
      },
      {
        id: 2,
        title: "Policy & Access",
        description: "Define platform-wide rules",
        fields: [
          { key: "allowSelfSignup", label: "Allow Student Self-Signup", type: "boolean", helper: "Students can register without an invite code." },
          { key: "aiLevel", label: "AI Intervention Level", type: "select", helper: "How aggressive should the AI be in interventions?", options: [
            { label: "Passive (Reports Only)", value: "passive" },
            { label: "Active (Suggestions)", value: "active" },
            { label: "Strict (Forced Paths)", value: "strict" },
          ]},
        ],
      },
    ],
  },

  [Role.PARENT]: {
    label: "Parent Onboarding",
    intro: "Connect with your child's academic journey.",
    completionLabel: "View Progress",
    steps: [
      {
        id: 1,
        title: "Link Student",
        description: "Pair your account with your child's student ID",
        fields: [
          { key: "studentCode", label: "Student Linking Code", type: "text", helper: "Ask your child for their unique profile link code.", placeholder: "LUM-XXXX", required: true },
        ],
      },
    ],
  },

  [Role.COUNSELOR]: {
    label: "Counselor Onboarding",
    intro: "Prepare your safeguarding and support tools.",
    completionLabel: "Start Sessions",
    steps: [
      {
        id: 1,
        title: "Assignment",
        description: "Define your department assignment",
        fields: [
          { key: "assignedDepartments", label: "Assigned Departments", type: "array", helper: "Departments you will monitor.", placeholder: "First Year Engineering", required: true },
        ],
      },
      {
        id: 2,
        title: "Risk Thresholds",
        description: "Configure intervention triggers",
        fields: [
          { key: "riskThreshold", label: "Risk Alert Threshold", type: "number", helper: "Trigger alert when risk score exceeds (0-100).", placeholder: "70", required: true },
        ],
      },
    ],
  },

  [Role.PEER_MENTOR]: {
    label: "Peer Mentor Onboarding",
    intro: "Join the community as a certified knowledge sharer.",
    completionLabel: "Become a Mentor",
    steps: [
      {
        id: 1,
        title: "Mentorship Focus",
        description: "Identify subjects you can represent",
        fields: [
          { key: "mentorSubjects", label: "Subjects for Mentorship", type: "array", helper: "Subjects you excel in.", placeholder: "Mathematics\nPython", required: true },
          { key: "trainingCompleted", label: "I have completed the Mentor Training Module", type: "boolean", helper: "Confirming you've read the guidelines.", required: true },
        ],
      },
    ],
  },

  [Role.ALUMNI]: {
    label: "Alumni Onboarding",
    intro: "Keep your legacy alive by helping current students.",
    completionLabel: "Access Network",
    steps: [
      {
        id: 1,
        title: "Graduation Details",
        description: "Your academic history",
        fields: [
          { key: "batch", label: "Graduation Batch", type: "text", helper: "e.g., 2020-2024", placeholder: "2024", required: true },
          { key: "industryRole", label: "Current Industry Role", type: "text", helper: "Your current profession.", placeholder: "Software Engineer at Google", required: true },
        ],
      },
    ],
  },

  [Role.SUPER_ADMIN]: {
    label: "Platform Admin Onboarding",
    intro: "Global platform configuration and health monitoring.",
    completionLabel: "Launch Platform",
    steps: [
      {
        id: 1,
        title: "Regional Setup",
        description: "Language and regional settings",
        fields: [
          { key: "deploymentRegion", label: "Deployment Region", type: "text", helper: "Primary data center region.", placeholder: "US-EAST-1", required: true },
          { key: "multiInstitutional", label: "Enable Multi-Institutional Mode", type: "boolean", helper: "Allow hosting multiple colleges on this instance." },
        ],
      },
    ],
  },
};

export function getRoleOnboardingConfig(role: SupportedRoleOnboardingRole): RoleOnboardingConfig {
  return CONFIGS[role];
}

export function parseListInput(input: string): string[] {
  return input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateRoleStep(
  role: SupportedRoleOnboardingRole,
  step: SupportedRoleStep,
  values: Record<string, any>,
): { success: boolean; data?: Record<string, any>; errors?: Record<string, string>; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } } {
  const config = CONFIGS[role];
  if (!config) {
    const errors = { _form: "Unknown role" };
    return {
      success: false,
      errors,
      error: {
        flatten: () => ({ fieldErrors: Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, [value]])) }),
      },
    };
  }

  const stepConfig = config.steps.find((s) => s.id === step);
  if (!stepConfig) {
    const errors = { _form: "Unknown step" };
    return {
      success: false,
      errors,
      error: {
        flatten: () => ({ fieldErrors: Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, [value]])) }),
      },
    };
  }

  const errors: Record<string, string> = {};
  const data: Record<string, any> = {};

  for (const field of stepConfig.fields) {
    const value = values[field.key];

    if (field.required) {
      if (field.type === "boolean" && !value) {
        errors[field.key] = `${field.label} is required.`;
        continue;
      }
      if (
        field.type !== "boolean" &&
        (value === undefined || value === null || value === "" ||
          (Array.isArray(value) && value.length === 0))
      ) {
        errors[field.key] = `${field.label} is required.`;
        continue;
      }
    }

    data[field.key] = value ?? (field.type === "boolean" ? false : field.type === "array" || field.type === "multiselect" ? [] : "");
  }

  if (Object.keys(errors).length > 0) {
    return {
      success: false,
      errors,
      error: {
        flatten: () => ({ fieldErrors: Object.fromEntries(Object.entries(errors).map(([key, value]) => [key, [value]])) }),
      },
    };
  }

  return { success: true, data };
}

export function fieldErrors(result: {
  success: boolean;
  errors?: Record<string, string>;
}): Record<string, string> {
  return result.errors ?? {};
}
