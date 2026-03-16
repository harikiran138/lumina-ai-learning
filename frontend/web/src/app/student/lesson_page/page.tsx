"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LessonPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId");
  const lessonId = searchParams.get("lessonId");
  const [course, setCourse] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!courseId) {
        router.push("/student/courses");
        return;
      }
      try {
        const courseData = await api.getCourseDetails(courseId);
        setCourse(courseData);
        if (lessonId && courseData?.modules) {
          for (const mod of courseData.modules) {
            const found = (mod.lessons || []).find((l: any) => l.id === lessonId);
            if (found) { setLesson(found); break; }
          }
        }
      } catch (e) {
        console.error("Failed to load lesson", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, lessonId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading lesson...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.push(courseId ? `/student/courses/${courseId}` : "/student/courses")}
        className="mb-6 text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
      >
        ← Back to Course
      </button>

      {course && (
        <p className="text-sm text-gray-500 mb-1">{course.name}</p>
      )}

      <h1 className="text-3xl font-bold mb-6 text-white">
        {lesson?.title || "Lesson"}
      </h1>

      {lesson?.content ? (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 leading-relaxed text-gray-200 whitespace-pre-wrap">
          {lesson.content}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 text-center text-gray-400">
          <p className="text-lg mb-2">No content available for this lesson yet.</p>
          <p className="text-sm">Check back later or contact your teacher.</p>
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <button
          onClick={async () => {
            if (courseId && lessonId) {
              await api.completeLesson(courseId, "", lessonId);
              router.push(`/student/courses/${courseId}`);
            }
          }}
          className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-lg font-medium transition-colors"
        >
          Mark as Complete
        </button>
        <button
          onClick={() => router.push("/student/ai_tutor")}
          className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
        >
          Ask AI Tutor
        </button>
      </div>
    </div>
  );
}
