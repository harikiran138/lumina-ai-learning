export interface AIQueueStudentView {
  id: string;
  question: string;
  status: string;
}

export interface AIQueueTeacherView {
  id: string;
  question_text: string;
  student_id: string;
}

export interface AIQueueAdminView {
  id: string;
  status: string;
}

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
}
