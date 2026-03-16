"use client";

import { useEffect, useState } from "react";
import { 
  Library, 
  Search, 
  Filter, 
  Plus, 
  BookOpen, 
  Users, 
  MoreHorizontal,
  Tags,
  Globe,
  Star,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  students_count: number;
}

export default function CourseLibrary() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/courses");
        const data = await res.json();
        setCourses(data);
      } catch (err) {
        console.error("failed_to_load_courses", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Library className="h-8 w-8 text-amber-500" />
            Global Course Library
          </h1>
          <p className="mt-1 text-gray-400">Manage and audit all learning content across the ecosystem.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            <Plus className="h-4 w-4" />
            Create Course
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Search library..." 
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-gray-400 hover:text-white transition-all">
            <Filter className="h-4 w-4" />
            Category
          </button>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-xl font-bold text-white">{courses.length}</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-right">Active Listings</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-right">
            <p className="text-xl font-bold text-amber-400">12.4k</p>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest text-right">Total Enrollments</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <div key={course.id} className="glass-v2 border-white/5 overflow-hidden group hover:border-amber-500/30 transition-all flex flex-col">
            <div className="h-32 bg-gradient-to-br from-amber-600/20 to-yellow-600/20 relative p-6">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md text-[9px] font-bold text-white uppercase tracking-wider border border-white/10">
                  {course.code || "CS101"}
                </span>
                <button className="p-1.5 rounded-lg bg-black/40 backdrop-blur-md text-gray-400 hover:text-white transition-colors">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <h3 className="text-lg font-display font-bold text-white group-hover:text-amber-400 transition-colors line-clamp-1">{course.title}</h3>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <p className="text-xs text-gray-400 line-clamp-2 mb-6 leading-relaxed">
                {course.description || "No description provided for this catalog listing."}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                    <Users className="h-3 w-3" />
                    {course.students_count || 0}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                    <Star className="h-3 w-3 text-amber-500" />
                    4.8
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] font-bold text-yellow-400 uppercase">Managed</span>
                </div>
              </div>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="col-span-full py-20 text-center glass-v2 border-dashed border-white/10">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 text-gray-600">
                <BookOpen className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-white font-bold">The library is empty</h3>
                <p className="text-sm text-gray-500">No courses have been registered in the global catalog yet.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
