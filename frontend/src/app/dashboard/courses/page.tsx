'use client';

import { useEffect, useState } from 'react';
import { useAuth, ROLES } from '@/lib/auth';
import { courses } from '@/lib/api';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [courseList, setCourseList] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const data = await courses.list();
        setCourseList(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading courses</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canCreateCourse = user?.role === ROLES.ADMIN || user?.role === ROLES.TEACHER;

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Courses
          </h2>
        </div>
        {canCreateCourse && (
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              href="/dashboard/courses/create"
              className="ml-3 inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Course
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courseList.map((course) => (
          <div
            key={course.id}
            className="relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="flex flex-1 flex-col p-6">
              <div className="flex-1">
                <div className="mt-2 block">
                  <p className="text-xl font-semibold text-gray-900">{course.name}</p>
                  <p className="mt-3 text-base text-gray-500">{course.description}</p>
                </div>
                <div className="mt-6 flex items-center gap-x-2.5">
                  <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    course.status === 'published'
                      ? 'bg-green-100 text-green-800'
                      : course.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                  </div>
                  <time dateTime={course.created_at} className="text-xs text-gray-500">
                    Created {new Date(course.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href={`/dashboard/courses/${course.id}`}
                  className="relative flex w-full items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  View Course
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courseList.length === 0 && (
        <div className="text-center">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
          <p className="mt-1 text-sm text-gray-500">
            {canCreateCourse
              ? 'Get started by creating a new course.'
              : 'No courses are available yet.'}
          </p>
          {canCreateCourse && (
            <div className="mt-6">
              <Link
                href="/dashboard/courses/create"
                className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Course
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}