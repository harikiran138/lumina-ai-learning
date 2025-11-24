'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { courses } from '@/lib/api';
import { useAuth, ROLES } from '@/lib/auth';
import Link from 'next/link';

interface Lesson {
  id: number;
  title: string;
  content: string;
  order: number;
  created_at: string;
}

interface CourseDetails {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export default function CoursePage() {
  const params = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const courseId = params.courseId as string;

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const [courseData, lessonsData] = await Promise.all([
          courses.get(courseId),
          courses.getLessons(courseId),
        ]);
        setCourse(courseData);
        setLessons(lessonsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || 'Failed to load course');
        }
        
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-24 bg-gray-200 rounded mb-8"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading course</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error || 'Course not found'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canEditCourse = user?.role === ROLES.ADMIN || course.teacher_id === user?.id;

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {course.name}
          </h2>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <div className={`mr-2 h-2.5 w-2.5 rounded-full ${
                course.status === 'published'
                  ? 'bg-green-400'
                  : course.status === 'draft'
                  ? 'bg-yellow-400'
                  : 'bg-gray-400'
              }`} />
              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              Created {new Date(course.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        {canEditCourse && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              href={`/dashboard/courses/${course.id}/edit`}
              className="ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Edit Course
            </Link>
            <Link
              href={`/dashboard/courses/${course.id}/lessons/create`}
              className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add Lesson
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Description</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>{course.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Lessons</h3>
            <p className="mt-2 text-sm text-gray-700">
              A list of all lessons in this course organized by order.
            </p>
          </div>
        </div>

        <div className="mt-4 ring-1 ring-gray-300 rounded-lg divide-y divide-gray-300">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`flex items-center justify-between px-6 py-4 ${
                index === 0 ? 'rounded-t-lg' : ''
              } ${index === lessons.length - 1 ? 'rounded-b-lg' : ''} hover:bg-gray-50`}
            >
              <div className="flex items-center min-w-0">
                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-900 text-sm font-medium">
                  {lesson.order}
                </div>
                <div className="ml-4 truncate">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {lesson.title}
                  </p>
                  <time dateTime={lesson.created_at} className="text-xs text-gray-500">
                    Added {new Date(lesson.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
              <Link
                href={`/dashboard/courses/${course.id}/lessons/${lesson.id}`}
                className="ml-6 inline-flex items-center rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                View Lesson
              </Link>
            </div>
          ))}

          {lessons.length === 0 && (
            <div className="text-center py-6">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No lessons</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new lesson.
              </p>
              {canEditCourse && (
                <div className="mt-6">
                  <Link
                    href={`/dashboard/courses/${course.id}/lessons/create`}
                    className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add Lesson
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}