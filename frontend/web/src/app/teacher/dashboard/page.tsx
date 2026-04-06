"use client";

import TeacherDashboardContent from "@/components/teacher/TeacherDashboard";

/**
 * Teacher Dashboard Page
 * 
 * This page serves as the entry point for the teacher's overview.
 * Most logic has been refactored into the modular TeacherDashboard component
 * to allow for better maintenance and reuse.
 */
export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <div className="mb-10">
        <h1 className="text-4xl font-display font-black text-white tracking-tight sm:text-5xl">
          Lumina <span className="text-lumina-highlight">Intelligence</span> Hub
        </h1>
        <p className="mt-2 text-gray-500 font-medium text-lg">Synchronizing your global academic streams and student momentum.</p>
      </div>
      
      <TeacherDashboardContent />
    </div>
  );
}
