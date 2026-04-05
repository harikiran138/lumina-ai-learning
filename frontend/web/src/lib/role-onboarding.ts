export type SupportedRoleOnboardingRole =
  | "teacher"
  | "parent"
  | "mentor"
  | "peer_tutor"
  | "counselor"
  | "researcher"
  | "alumni"
  | "content_creator";

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
  teacher: {
    label: "Teacher Onboarding",
    intro:
      "Complete your educator profile so students and administrators can get the most from your teaching.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Personal Details",
        description: "Official teaching credentials",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your full name for account verification.", placeholder: "Jane Doe", required: true },
          { key: "employeeId", label: "Employee ID", type: "text", helper: "Your official institutional employee identifier.", placeholder: "EMP-1024", required: true },
          { key: "collegeId", label: "Institution ID", type: "text", helper: "The unique ID of your college or university.", placeholder: "INST-8822", required: true },
          { key: "department", label: "Department", type: "text", helper: "Your primary department (e.g., Computer Science).", placeholder: "Computer Science", required: true },
          { key: "designation", label: "Designation", type: "text", helper: "Your current job title (e.g., Assistant Professor).", placeholder: "Assistant Professor", required: true },
        ],
      },
      {
        id: 2,
        title: "Teaching Profile",
        description: "Describe your subject areas and teaching style.",
        fields: [
          { key: "subjects", label: "Subjects / disciplines", type: "array", helper: "List the subjects you teach, one per line.", placeholder: "Mathematics\nPhysics" },
          { key: "specialisation", label: "Specialisation", type: "text", helper: "Your primary academic or research specialisation.", placeholder: "Machine Learning & AI" },
          { key: "teachingStyle", label: "Teaching style", type: "select", helper: "How would you describe your primary teaching approach?", options: [
            { label: "Lecture-based", value: "lecture" },
            { label: "Project-based", value: "project" },
            { label: "Inquiry / Socratic", value: "inquiry" },
            { label: "Flipped classroom", value: "flipped" },
            { label: "Mixed / Hybrid", value: "mixed" },
          ]},
        ],
      },
      {
        id: 3,
        title: "Experience & Qualifications",
        description: "Share your academic background and years of experience.",
        fields: [
          { key: "yearsExperience", label: "Years of teaching experience", type: "number", helper: "Approximate number of years.", placeholder: "5" },
          { key: "qualifications", label: "Qualifications", type: "array", helper: "List your degrees or certifications, one per line.", placeholder: "M.Ed. – University of Example\nCertified STEM Educator" },
          { key: "researchAreas", label: "Research areas (Optional)", type: "array", helper: "List your research topics if applicable, one per line.", placeholder: "Natural Language Processing\nComputer Vision" },
        ],
      },
      {
        id: 4,
        title: "Platform Preferences",
        description: "Let us know how you prefer to use Lumina.",
        fields: [
          { key: "aiAssistEnabled", label: "Enable AI teaching & grading assistant", type: "boolean", helper: "Allow Lumina AI to suggest content and assist with grading recommendations." },
          { key: "notifyOnSubmission", label: "Notify me on student submissions", type: "boolean", helper: "Receive an in-app notification whenever a student submits work." },
          { key: "officeHoursPublic", label: "Make office hours public", type: "boolean", helper: "Allow students to see your office hours on your profile." },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Review and confirm your profile before finishing setup.",
        fields: [
          { key: "agreedToTerms", label: "I agree to the teacher conduct policy", type: "boolean", helper: "Confirm that you accept the educator guidelines and institutional conduct policy.", required: true },
        ],
      },
    ],
  },

  parent: {
    label: "Parent / Guardian Onboarding",
    intro:
      "Set up your guardian profile so you can monitor your child's progress and stay informed.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Your Details",
        description: "Tell us about yourself as a guardian.",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your full name for account verification.", placeholder: "Jane Doe", required: true },
          { key: "relationship", label: "Relationship to student", type: "select", helper: "Your relationship to the learner you are monitoring.", options: [
            { label: "Parent", value: "parent" },
            { label: "Guardian", value: "guardian" },
            { label: "Sibling", value: "sibling" },
            { label: "Other", value: "other" },
          ]},
        ],
      },
      {
        id: 2,
        title: "Link Student",
        description: "Enter the code provided by your child to link their account to yours.",
        fields: [
          { 
            key: "studentCode", 
            label: "Student Linking Code", 
            type: "text", 
            helper: "Enter the 8-character code from your child's student dashboard.", 
            placeholder: "LUM-XXXX", 
            required: true 
          },
        ],
      },
      {
        id: 3,
        title: "Guardian Preferences",
        description: "Configure how you want to stay informed about progress.",
        fields: [
          { key: "contactEmail", label: "Contact email", type: "text", helper: "Email address for progress reports.", placeholder: "parent@example.com" },
          { key: "notificationFrequency", label: "Update frequency", type: "select", helper: "How often should we send updates?", options: [
            { label: "Daily digest", value: "daily" },
            { label: "Weekly summary", value: "weekly" },
            { label: "Important events only", value: "events_only" },
          ]},
          { key: "trackAreas", label: "Areas to monitor", type: "multiselect", helper: "Select aspects of your child's learning to follow.", options: [
            { label: "Assignment submissions", value: "assignments" },
            { label: "Test & quiz results", value: "tests" },
            { label: "AI risk flags", value: "risk_flags" },
            { label: "Attendance", value: "attendance" },
          ]},
        ],
      },
      {
        id: 4,
        title: "Privacy & Consent",
        description: "Review how your data is used.",
        fields: [
          { key: "dataConsent", label: "I consent to data processing as described in the privacy policy", type: "boolean", helper: "Lumina uses your contact details to send progress reports. You can opt out at any time.", required: true },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Confirm your guardian profile.",
        fields: [
          { key: "agreedToTerms", label: "I agree to the guardian terms of service", type: "boolean", helper: "Confirm your acceptance of the Lumina guardian terms.", required: true },
        ],
      },
    ],
  },

  mentor: {
    label: "Mentor Onboarding",
    intro:
      "Complete your mentor profile to start guiding learners through their academic and career journeys.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Personal Details",
        description: "Introduce yourself to the Lumina community.",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your display name on the platform.", placeholder: "Alex Rivera", required: true },
          { key: "bio", label: "Mentor bio", type: "textarea", helper: "A short paragraph about your background and mentoring philosophy.", placeholder: "I mentor students on..." },
        ],
      },
      {
        id: 2,
        title: "Expertise & Focus",
        description: "Tell us what you specialise in as a mentor.",
        fields: [
          { key: "expertiseAreas", label: "Areas of expertise", type: "array", helper: "List the topics you can mentor on, one per line.", placeholder: "Software Engineering\nCareer Planning" },
          { key: "mentorFocus", label: "Mentoring focus", type: "multiselect", helper: "Select the types of support you offer.", options: [
            { label: "Academic support", value: "academic", helper: "Help with coursework and study strategies." },
            { label: "Career guidance", value: "career", helper: "Resume reviews, interview prep, and job search." },
            { label: "Skill development", value: "skills", helper: "Teaching specific technical or soft skills." },
            { label: "Wellbeing & motivation", value: "wellbeing", helper: "Emotional support and motivation coaching." },
          ]},
        ],
      },
      {
        id: 3,
        title: "Availability",
        description: "Set your mentoring availability.",
        fields: [
          { key: "hoursPerWeek", label: "Hours available per week", type: "number", helper: "How many hours per week can you dedicate to mentoring?", placeholder: "3" },
          { key: "preferredDays", label: "Preferred days / times", type: "textarea", helper: "Describe your typical availability window.", placeholder: "Weekday evenings, weekends" },
        ],
      },
      {
        id: 4,
        title: "Platform Settings",
        description: "Configure your mentor experience.",
        fields: [
          { key: "openToNewMentees", label: "Open to new mentees", type: "boolean", helper: "Let students know you are currently accepting new mentees." },
          { key: "aiSuggestionsEnabled", label: "Enable AI mentoring suggestions", type: "boolean", helper: "Allow AI to surface learner progress data relevant to your mentees." },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Confirm your mentor profile.",
        fields: [
          { key: "agreedToTerms", label: "I agree to the mentor code of conduct", type: "boolean", helper: "Confirm that you accept the Lumina mentor conduct standards.", required: true },
        ],
      },
    ],
  },

  peer_tutor: {
    label: "Peer Tutor Onboarding",
    intro:
      "Set up your peer tutor profile so other students can find and book sessions with you.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "About You",
        description: "Help fellow students get to know you.",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your name as it will appear on the peer tutor directory.", placeholder: "Jordan Lee", required: true },
          { key: "studentId", label: "Student ID", type: "text", helper: "Your institutional student ID number.", placeholder: "STU-20240001", required: true },
          { key: "studyYear", label: "Current year of study", type: "number", helper: "Which year of your programme are you in?", placeholder: "3" },
        ],
      },
      {
        id: 2,
        title: "Subjects You Tutor",
        description: "Tell us which subjects you can help with.",
        fields: [
          { key: "tutoringSubjects", label: "Subjects", type: "array", helper: "List the subjects you can tutor, one per line.", placeholder: "Calculus\nLinear Algebra\nPython" },
          { key: "tutoringLevel", label: "Level you tutor", type: "select", helper: "What academic level do you primarily support?", options: [
            { label: "Introductory / Year 1–2", value: "introductory" },
            { label: "Intermediate / Year 2–3", value: "intermediate" },
            { label: "Advanced / Year 3+", value: "advanced" },
            { label: "All levels", value: "all" },
          ]},
        ],
      },
      {
        id: 3,
        title: "Session Format",
        description: "How do you prefer to run your tutoring sessions?",
        fields: [
          { key: "sessionFormat", label: "Session format", type: "multiselect", helper: "Select all formats you are comfortable with.", options: [
            { label: "One-on-one", value: "one_on_one", helper: "Individual tutoring sessions." },
            { label: "Small group (2–5)", value: "small_group", helper: "Group study or tutoring." },
            { label: "Online / video call", value: "online", helper: "Remote sessions via video platform." },
            { label: "In-person", value: "in_person", helper: "Face-to-face on campus." },
          ]},
          { key: "hoursPerWeek", label: "Hours available per week", type: "number", helper: "How many hours can you commit to tutoring?", placeholder: "4" },
        ],
      },
      {
        id: 4,
        title: "Platform Settings",
        description: "Configure your tutor listing.",
        fields: [
          { key: "listingPublic", label: "Make my profile public", type: "boolean", helper: "Allow other students to find and book you as a peer tutor." },
          { key: "aiInsightsEnabled", label: "Enable AI session insights", type: "boolean", helper: "Allow AI to provide feedback on tutoring session quality." },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Confirm your peer tutor profile.",
        fields: [
          { key: "agreedToTerms", label: "I agree to the peer tutor guidelines", type: "boolean", helper: "Confirm you accept the Lumina peer tutor conduct guidelines.", required: true },
        ],
      },
    ],
  },

  researcher: {
    label: "Researcher Onboarding",
    intro:
      "Set up your researcher profile to collaborate, publish, and access the Lumina research ecosystem.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Researcher Identity",
        description: "Tell us about your research background.",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your name as it will appear on publications and collaboration requests.", placeholder: "Dr. Morgan Chen", required: true },
          { key: "institution", label: "Institution / Organisation", type: "text", helper: "Your primary affiliated institution or organisation.", placeholder: "University of Example" },
        ],
      },
      {
        id: 2,
        title: "Research Focus",
        description: "Define your areas of research.",
        fields: [
          { key: "researchAreas", label: "Research areas", type: "array", helper: "List your research topics, one per line.", placeholder: "Educational Technology\nLearning Analytics" },
          { key: "researchMethods", label: "Primary research methods", type: "multiselect", helper: "Select the methods you primarily use.", options: [
            { label: "Quantitative", value: "quantitative", helper: "Statistical and numerical analysis." },
            { label: "Qualitative", value: "qualitative", helper: "Interviews, focus groups, observations." },
            { label: "Mixed methods", value: "mixed", helper: "Combination of quantitative and qualitative." },
            { label: "Computational / AI", value: "computational", helper: "Machine learning and data-driven research." },
          ]},
        ],
      },
      {
        id: 3,
        title: "Publications & Experience",
        description: "Share your academic output.",
        fields: [
          { key: "publicationCount", label: "Approximate publications", type: "number", helper: "Total number of peer-reviewed publications.", placeholder: "12" },
          { key: "researchBio", label: "Research statement", type: "textarea", helper: "A short paragraph describing your current research agenda.", placeholder: "My research focuses on..." },
        ],
      },
      {
        id: 4,
        title: "Collaboration Preferences",
        description: "Tell us how you like to collaborate.",
        fields: [
          { key: "openToCollaboration", label: "Open to collaboration requests", type: "boolean", helper: "Allow other researchers and educators to send you collaboration invites." },
          { key: "dataAccessRequest", label: "Request access to anonymised learning data", type: "boolean", helper: "I would like access to anonymised Lumina platform data for academic research purposes." },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Confirm your researcher profile.",
        fields: [
          { key: "agreedToTerms", label: "I agree to the research ethics guidelines", type: "boolean", helper: "Confirm that you accept Lumina's research ethics and data handling policy.", required: true },
        ],
      },
    ],
  },
  counselor: {
    label: "Counselor Onboarding",
    intro: "Complete your counselor profile to assist students with their wellbeing and academic journey.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Personal Details",
        description: "Tell us about your background and counseling experience.",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your professional name.", placeholder: "Dr. Sam Wilson", required: true },
          { key: "specialisations", label: "Specialisations", type: "array", helper: "List your areas of expertise, one per line.", placeholder: "Academic Counseling\nMental Health" },
        ],
      },
      {
        id: 2,
        title: "Bio & Approach",
        description: "Describe your counseling philosophy.",
        fields: [
          { key: "bio", label: "Counselor bio", type: "textarea", helper: "A brief description of your approach.", placeholder: "I help students navigate..." },
        ],
      },
      {
        id: 3,
        title: "Availability",
        description: "Set your typical counseling hours.",
        fields: [
          { key: "hoursPerWeek", label: "Hours available per week", type: "number", helper: "Approximate hours for student sessions.", placeholder: "20" },
        ],
      },
      {
        id: 4,
        title: "Platform Preferences",
        description: "Configure how you work within Lumina.",
        fields: [
          { key: "notifyOnDirectMessage", label: "Notify on student messages", type: "boolean", helper: "Get an alert when a student reaches out to you." },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Review and confirm your profile.",
        fields: [
          { key: "agreedToTerms", label: "I agree to the professional conduct policy", type: "boolean", helper: "Confirm you accept the institutional counseling guidelines.", required: true },
        ],
      },
    ],
  },
  alumni: {
    label: "Alumni Onboarding",
    intro: "Rejoin the community to mentor current students and expand your professional network.",
    completionLabel: "Finish setup",
    steps: [
      {
        id: 1,
        title: "Academic Background",
        description: "Verify your graduation details.",
        fields: [
          { key: "fullName", label: "Full name", type: "text", helper: "Your name as it appeared during graduation.", required: true },
          { key: "graduationYear", label: "Year of Graduation", type: "number", helper: "The year you completed your course.", placeholder: "2022", required: true },
          { key: "major", label: "Field of Study", type: "text", helper: "Your primary major/specialisation.", placeholder: "Computer Science", required: true },
        ],
      },
      {
        id: 2,
        title: "Professional Journey",
        description: "Tell us what you've been up to since graduation.",
        fields: [
          { key: "currentCompany", label: "Current Company / Organisation", type: "text", helper: "Where are you currently working?", placeholder: "Google" },
          { key: "jobTitle", label: "Current Role", type: "text", helper: "Your current designation.", placeholder: "Senior Engineer" },
          { key: "industry", label: "Industry", type: "select", helper: "Primary industry you work in.", options: [
            { label: "Technology", value: "tech" },
            { label: "Finance", value: "finance" },
            { label: "Healthcare", value: "healthcare" },
            { label: "Education", value: "education" },
            { label: "Other", value: "other" },
          ]},
        ],
      },
      {
        id: 3,
        title: "Mentorship & Giving Back",
        description: "Let us know how you'd like to support current students.",
        fields: [
          { key: "openToMentoring", label: "Open to mentoring students", type: "boolean", helper: "Allow current students to reach out for guidance." },
          { key: "expertise", label: "Areas of Expertise", type: "array", helper: "List skills you can mentor on, one per line.", placeholder: "System Design\nCareer Prep" },
        ],
      },
      {
        id: 4,
        title: "Privacy Settings",
        description: "Control your visibility in the alumni directory.",
        fields: [
          { key: "isPublic", label: "Make profile public to other alumni", type: "boolean", helper: "Your profile will be visible to fellow alumni for networking." },
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Confirm and join the alumni network.",
        fields: [
          { key: "agreedToAlumniTerms", label: "I agree to the alumni network guidelines", type: "boolean", helper: "Confirm acceptance of the professional conduct policy.", required: true },
        ],
      },
    ],
  },
  content_creator: {
    label: "Creator Onboarding",
    intro: "Set up your studio to start building high-quality educational content and courses.",
    completionLabel: "Launch Studio",
    steps: [
      {
        id: 1,
        title: "Creator Identity",
        description: "Tell us about your brand or persona.",
        fields: [
          { key: "fullName", label: "Full name / Brand name", type: "text", helper: "Your display name in the Studio.", required: true },
          { key: "expertise", label: "Primary Expertise", type: "text", helper: "What is your main teaching domain?", placeholder: "Full Stack Development", required: true },
        ],
      },
      {
        id: 2,
        title: "Content Strategy",
        description: "What kind of content do you plan to create?",
        fields: [
          { key: "contentType", label: "Preferred Content Type", type: "multiselect", helper: "Select types of materials you want to build.", options: [
            { label: "Video Courses", value: "video" },
            { label: "Interactive Exercises", value: "interactive" },
            { label: "AI-Assisted Textbooks", value: "textbook" },
            { label: "Assessment Banks", value: "assessments" },
          ]},
          { key: "targetLevel", label: "Target Learner Level", type: "select", helper: "Who is your primary audience?", options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
            { label: "Professional", value: "pro" },
          ]},
        ],
      },
      {
        id: 3,
        title: "Studio Preferences",
        description: "Configure your workspace.",
        fields: [
          { key: "prefersDarkMode", label: "Default Studio Theme", type: "select", helper: "Choose your preferred editor theme.", options: [
            { label: "Modern Dark", value: "dark" },
            { label: "Clean Light", value: "light" },
          ]},
          { key: "aiCocreationEnabled", label: "Enable AI Co-creation", type: "boolean", helper: "Allow Lumina AI to suggest curriculum outlines and generate initial drafts." },
        ],
      },
      {
        id: 4,
        title: "Publication Settings",
        description: "How do you want to share your work?",
        fields: [
          { key: "defaultLicense", label: "Default Content License", type: "select", helper: "Choose how your content can be used.", options: [
            { label: "Standard Lumina License", value: "standard" },
            { label: "Creative Commons (BY-NC)", value: "cc_by_nc" },
            { label: "Open Education Resource (OER)", value: "oer" },
          ]},
        ],
      },
      {
        id: 5,
        title: "Final Review",
        description: "Ready to start creating?",
        fields: [
          { key: "agreedToCreatorTerms", label: "I agree to the content creator policy", type: "boolean", helper: "Accept the intellectual property and quality guidelines.", required: true },
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

  // Generic validation is handled by field.required, but role-specific cross-field checks can go here.
  // Previous validations for studentIds/collegeId were removed as they targeted non-existent fields in those steps.

  if (role === "parent" && step === 2) {
    const ids = values.studentIds;
    if (!ids || (Array.isArray(ids) && ids.length === 0)) {
      errors.studentIds = "At least one linked student is required.";
    }
  }

  if (role === "researcher" && step === 2 && values.dataAccessLevel === "full" && values.ethicsApproval !== true) {
    errors.ethicsApproval = "Ethics approval is required for full data access.";
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
