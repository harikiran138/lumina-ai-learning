import { 
  GraduationCap, 
  BookOpen, 
  Shield, 
  Crown, 
  Heart, 
  Search, 
  Users, 
  Award, 
  HardHat,
  LucideIcon
} from "lucide-react";

export interface RoleFeature {
  name: string;
  explanation: string;
}

export interface RoleInteraction {
  role: string;
  explanation: string;
}

export interface RoleData {
  slug: string;
  title: string;
  tagline: string;
  iconName: string;
  icon: LucideIcon;
  purpose: string;
  functionalities: RoleFeature[];
  access: {
    see: string[];
    do: string[];
  };
  interactions: RoleInteraction[];
  workflowSteps: string[];
}

export const roleRegistry: Record<string, RoleData> = {
  student: {
    slug: "student",
    title: "Student",
    tagline: "Adaptive Learner powered by AI",
    iconName: "GraduationCap",
    icon: GraduationCap,
    purpose: "The core learner: mastering concepts through AI-powered pathways tailored to individual cognitive needs.",
    functionalities: [
      {
        name: "AI Tutor Workspace",
        explanation: "Socratic assistant providing scaffolded support without giving direct answers, encouraging critical thinking."
      },
      {
        name: "Adaptive Assessments",
        explanation: "Quizzes that adjust difficulty in real-time based on your previous answers and concept mastery levels."
      },
      {
        name: "Knowledge Graph Visualization",
        explanation: "A visual map of your learning journey showing concept connections and prerequisites."
      },
      {
        name: "Smart Notes & Reflection",
        explanation: "AI-assisted note-taking with automatic concept grouping and flashcard generation for active recall."
      }
    ],
    access: {
      see: ["Personal mastery levels", "Course recommendations", "Own assignment feedback"],
      do: ["Complete assessments", "Submit assignments", "Interact with AI Tutor"]
    },
    interactions: [
      { role: "Teacher", explanation: "Receiving direct guidance and verified content feedback." },
      { role: "Peer Mentor", explanation: "Collaborative learning and peer-level scaffolding support." },
      { role: "Counselor", explanation: "Support for wellbeing and academic persistence." }
    ],
    workflowSteps: [
      "Student asks a conceptual question in the AI Tutor Workspace.",
      "AI provides a hint or a simplified analogy based on current mastery.",
      "Student attempts a practice problem to verify understanding.",
      "System updates mastery score and unlocks relevant advanced modules."
    ]
  },
  teacher: {
    slug: "teacher",
    title: "Teacher",
    tagline: "AI-Augmented Educator",
    iconName: "BookOpen",
    icon: BookOpen,
    purpose: "Directing the educational journey through AI-automated coordination and human pedagogical insight.",
    functionalities: [
      {
        name: "AI Course Designer",
        explanation: "Quickly convert standard textbooks and PDFs into intelligent, modular adaptive courses."
      },
      {
        name: "Automated AI Grading",
        explanation: "Semantic evaluation of assignments with AI-drafted feedback for teacher review."
      },
      {
        name: "Teacher Intervention Queue",
        explanation: "Prioritized list of students requiring direct human guidance based on stalled progress signals."
      }
    ],
    access: {
      see: ["Assigned class analytics", "Individual student risk scores", "Intervention alerts"],
      do: ["Create course content", "Verify AI grading drafts", "Manage student interventions"]
    },
    interactions: [
      { role: "Student", explanation: "Delivering instruction and provide personalized mentoring." },
      { role: "HOD", explanation: "Reporting on curriculum health and student outcomes." },
      { role: "Parent", explanation: "Communicating progress milestones and early warning signs." }
    ],
    workflowSteps: [
      "Teacher uploads a syllabus chapter and defines learning objectives.",
      "AI generates modular pathways and practice banks for students.",
      "Teacher monitors the Intervention Queue for students needing support.",
      "Teacher provides 1-on-1 human feedback to flagged student groups."
    ]
  },
  hod: {
    slug: "hod",
    title: "Head of Department (HOD)",
    tagline: "Academic Governance & Excellence",
    iconName: "Shield",
    icon: Shield,
    purpose: "Governing academic standards and department-wide performance through real-time operational visibility.",
    functionalities: [
      {
        name: "Department Performance Audit",
        explanation: "Identify mastery gaps across the entire department that traditional grading systems miss."
      },
      {
        name: "Teacher Excellence Dashboard",
        explanation: "Monitor teaching effectiveness and responsiveness to intervention cues across all classes."
      },
      {
        name: "Curriculum Consistency Guard",
        explanation: "Ensure all teacher members are aligned with department-level learning standards and goals."
      }
    ],
    access: {
      see: ["Department-wide mastery metrics", "Teacher performance data", "Academic risk reports"],
      do: ["Approve curriculum updates", "Manage department structure", "Set academic targets"]
    },
    interactions: [
      { role: "Teacher", explanation: "Supervising content quality and intervention performance." },
      { role: "Institution Admin", explanation: "Resource allocation and institutional compliance reporting." },
      { role: "Student", explanation: "High-level oversight of department learner groups." }
    ],
    workflowSteps: [
      "HOD identifies a concept with low mastery rates across multiple classes.",
      "HOD reviews the shared content modules for consistency and quality.",
      "HOD suggests collaborative updates to the teaching teacher.",
      "HOD tracks the mastery delta following the intervention."
    ]
  },
  admin: {
    slug: "admin",
    title: "Institution Admin",
    tagline: "Institutional Intelligence & Operations",
    iconName: "Crown",
    icon: Crown,
    purpose: "Managing institutional operations, security governance, and overall academic hierarchy.",
    functionalities: [
      {
        name: "Institutional Hierarchy Setup",
        explanation: "Define the structural relationship between departments, programs, batches, and semesters."
      },
      {
        name: "User Management & RBAC",
        explanation: "Centralized control over user entry, identity verification, and role-based permissions."
      },
      {
        name: "Security & Compliance Console",
        explanation: "Audit interaction logs, detect anomalies, and manage institutional data policies."
      }
    ],
    access: {
      see: ["All institutional activity logs", "User enrollment data", "System health metrics"],
      do: ["Onboard new users", "Provision departments", "Adjust institutional settings"]
    },
    interactions: [
      { role: "HOD", explanation: "Assigning department leads and academic structures." },
      { role: "Super Admin", explanation: "Escalating platform-level technical or policy issues." },
      { role: "All Users", explanation: "Managing account statuses and overall system security." }
    ],
    workflowSteps: [
      "Admin provisions a new department and assigns an HOD.",
      "Admin generates and distributes enrollment codes for the new academic cycle.",
      "Admin monitors real-time enrollment and onboarding status.",
      "Admin manages user lifecycle from initial entry to graduation."
    ]
  },
  parent: {
    slug: "parent",
    title: "Parent",
    tagline: "Supporting Your Child's Success",
    iconName: "Heart",
    icon: Heart,
    purpose: "Empowering guardians to support student success through actionable progress visibility.",
    functionalities: [
      {
        name: "Actionable Progress Digest",
        explanation: "Clear, plain-language summaries of child's achievements and areas needing support."
      },
      {
        name: "Attendance & Alert Console",
        explanation: "Real-time visibility into student attendance and early warning alerts for missed deadlines."
      },
      {
        name: "Shared Goal Tracker",
        explanation: "Collaborative interface to set and track non-academic milestones with the student."
      }
    ],
    access: {
      see: ["Child's high-level progress", "Weekly digests", "Teacher announcements"],
      do: ["Update parent profile", "Interact with shared goals", "Communicate with support"]
    },
    interactions: [
      { role: "Student", explanation: "Supporting home learning environment and goal alignment." },
      { role: "Teacher", explanation: "Receiving updates on student breakthroughs or struggles." },
      { role: "Counselor", explanation: "Coordinating on student wellbeing and persistence." }
    ],
    workflowSteps: [
      "Parent receives a weekly achievement summary via the platform.",
      "Parent identifies a concept where the student is showing high persistence.",
      "Parent provides positive reinforcement based on specific AI-detected efforts.",
      "Student mastery continues to grow with increased motivation."
    ]
  },
  counselor: {
    slug: "counselor",
    title: "Counselor",
    tagline: "Safeguarding Student Wellbeing",
    iconName: "Search",
    icon: Search,
    purpose: "Monitoring wellbeing signals and providing human-centered pastoral care using early-warning data.",
    functionalities: [
      {
        name: "Early Warning Dashboard",
        explanation: "Centralized view of 'at-risk' flags triggered by disengagement or behavioral signals."
      },
      {
        name: "Mental Load Tracker",
        explanation: "Visibility into student assessment density and cognitive load to prevent burnout."
      },
      {
        name: "Encrypted Case Management",
        explanation: "Highly secure, isolated logs for wellbeing notes that are restricted from academic personnel."
      }
    ],
    access: {
      see: ["Wellbeing risk flags", "Cognitive load summaries", "Assigned case notes"],
      do: ["Update escalation status", "Log support sessions", "Flag urgent intervention needs"]
    },
    interactions: [
      { role: "Student", explanation: "Direct wellbeing support and stress management." },
      { role: "Teacher", explanation: "Coordinating human-centered responses to academic distress." },
      { role: "Parent", explanation: "Coordinating on home-based wellbeing support." }
    ],
    workflowSteps: [
      "Counselor receives a 'Sudden Disengagement' notification for a student.",
      "Counselor reviews the cognitive load map to understand the student's pressure.",
      "Counselor initiates a private check-in with the student.",
      "Counselor updates the case status and coordinates with teacher for accommodation."
    ]
  },
  mentor: {
    slug: "mentor",
    title: "Peer Mentor",
    tagline: "Collaborative Scaffolding Support",
    iconName: "Users",
    icon: Users,
    purpose: "Providing relatable, peer-level guidance reinforced by AI-powered coaching frameworks.",
    functionalities: [
      {
        name: "Stuck-Point Visualization",
        explanation: "See exactly which concept your mentee is currently struggling with before meeting."
      },
      {
        name: "AI Scaffolding Prompting",
        explanation: "Suggestions for Socratic questions to ask the mentee instead of giving them the answer."
      },
      {
        name: "Mentorship Impact Map",
        explanation: "Visual data showing the real-world impact you've had on your mentees' mastery scores."
      }
    ],
    access: {
      see: ["Mentee mastery graph (assigned views)", "Mentee stuck points", "Own impact charts"],
      do: ["Log mentorship sessions", "Add guidance notes", "Update mentee goals"]
    },
    interactions: [
      { role: "Student", explanation: "Providing relatability and direct peer-to-peer scaffolding." },
      { role: "Teacher", explanation: "Aligning peer support with course objectives and teacher goals." },
      { role: "Alumni", explanation: "Receiving industry-level mentorship and career guidance." }
    ],
    workflowSteps: [
      "Mentor identifies a mentee stalled on a prerequisite concept.",
      "Mentor uses the AI Socratic guide to prepare a questioning sequence.",
      "Mentor and Mentee hold a collaborative breakthrough session.",
      "Mentee achieves concept mastery; Mentor's impact score increases."
    ]
  },
  alumni: {
    slug: "alumni",
    title: "Alumni",
    tagline: "Industry Expertise & Legacy",
    iconName: "Award",
    icon: Award,
    purpose: "Connecting current learners with real-world industry context and career-readiness guidance.",
    functionalities: [
      {
        name: "Industry Mentorship Workspace",
        explanation: "Match with current students based on shared skill trees and career aspirations."
      },
      {
        name: "Project Certification",
        explanation: "Review and certify student projects with an industry-standard seal of approval."
      },
      {
        name: "Alumni Knowledge Hub",
        explanation: "Continued access to institutional modules for lifelong learning and professional growth."
      }
    ],
    access: {
      see: ["Mentee career goals", "Industry trend reports", "Institution legacy updates"],
      do: ["Certify student projects", "Manage mentorship availability", "Offer case studies"]
    },
    interactions: [
      { role: "Student", explanation: "Bridge the gap between academic theory and industry reality." },
      { role: "Peer Mentor", explanation: "Sharing advanced guidance with the next generation of leads." },
      { role: "Institution Admin", explanation: "Maintaining institutional legacy and professional network." }
    ],
    workflowSteps: [
      "Alumni offers a certification slot for an industry-standard skill.",
      "AI matches current students based on their portfolio and aspiration data.",
      "Alumni reviews the student's final project against industry benchmarks.",
      "Alumni certifies the project, adding significant value to the student's resume."
    ]
  },
  "super-admin": {
    slug: "super-admin",
    title: "Super Admin",
    tagline: "System-Wide Platform Governance",
    iconName: "HardHat",
    icon: HardHat,
    purpose: "Governing global platform infrastructure, security policies, and AI ethical guardrails at scale.",
    functionalities: [
      {
        name: "Global AI Guardian Policy",
        explanation: "Configure the prompt guardrails and safety thresholds used platform-wide."
      },
      {
        name: "Multi-Institution Console",
        explanation: "Top-level overview of system health and performance across all linked institutions."
      },
      {
        name: "Platform Cost & Resource Guard",
        explanation: "Monitor and optimize global API costs, token usage, and system resources."
      }
    ],
    access: {
      see: ["System-wide audit logs", "Global performance scores", "Cloud infrastructure status"],
      do: ["Adjust global AI policies", "Provision new institutions", "Manage system-level security"]
    },
    interactions: [
      { role: "Institution Admin", explanation: "Managing high-level platform access and institutional policy." },
      { role: "AI Engine", explanation: "Govern the core logic and safety systems of the Platform AI." },
      { role: "Teacher", explanation: "Top-level oversight of educational delivery health." }
    ],
    workflowSteps: [
      "Super Admin detects a global increase in toxic or off-path student prompts.",
      "Super Admin updates the AI Guardian prompt platform-wide to refine guardrails.",
      "Super Admin monitors the immediate decrease in policy violations.",
      "Super Admin verifies system integrity across all institutional nodes."
    ]
  }
};
