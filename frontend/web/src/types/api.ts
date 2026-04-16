export enum AIQueueStatus {
  pending = "pending",
  ai_answered = "ai_answered",
  provisional = "provisional",
  approved = "approved",
  edited_approved = "edited_approved",
  rejected = "rejected",
  escalated_to_faculty = "escalated_to_faculty",
  escalated_to_hod = "escalated_to_hod",
}

export interface AIQueueStudentView {
  id: string;
  question: string;
  status: AIQueueStatus;
  final_answer?: string | null;
  created_at?: string;
}

export interface AIQueueTeacherView {
  id: string;
  student_id: string;
  course_id?: string | null;
  question_text: string;
  ai_draft?: string | null;
  ai_confidence?: number | null;
  status: AIQueueStatus;
  teacher_note?: string | null;
  created_at?: string;
  time_pending_sec: number;
  released_to_student: boolean;
  request_mode?: string | null;
}

export interface AIQueueAdminView {
  id: string;
  student_id: string;
  teacher_id?: string | null;
  course_id?: string | null;
  question_text: string;
  ai_draft?: string | null;
  ai_confidence?: number | null;
  status: AIQueueStatus;
  teacher_note?: string | null;
  teacher_edited_answer?: string | null;
  released_to_student: boolean;
  created_at?: string;
  verified_at?: string | null;
}

/** 
 * Keep for backward compatibility with components using TeacherAiQueueItem 
 * but mark fields as optional/nullable to match the new canonical structure 
 */
export interface TeacherAiQueueItem {
  id: string;
  question_text?: string;
  ai_draft?: string;
  teacher_note?: string;
  faculty_note?: string;
  student_name?: string;
  student_id?: string;
  course_name?: string;
  course_id?: string;
  ai_confidence?: number | null;
  status?: string;
  created_at?: string;
  lecture_context?: string;
  released_to_student?: boolean;
}
