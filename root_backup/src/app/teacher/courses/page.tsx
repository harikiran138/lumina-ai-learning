
'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, MoreVertical, BookOpen, Clock, Users, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

export default function TeacherCourses() {
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadCourses = async () => {
        setIsLoading(true);
        const data = await api.getTeacherCourses();
        setCourses(data || []);
        setIsLoading(false);
    };

    // Load on mount
    useEffect(() => {
        loadCourses();
    }, []);

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                    <p className="text-gray-400">Manage and create your curriculum</p>
                </div>
                <Link href="/teacher/create-course" className="flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg transition-colors">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Course
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-gray-800 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
                    />
                </div>
                <button className="flex items-center px-4 py-2 bg-white/5 border border-gray-800 rounded-lg text-gray-300 hover:bg-white/10 transition-colors">
                    <Filter className="w-5 h-5 mr-2" />
                    Filters
                </button>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <Link key={course.id} href={`/teacher/courses/${course.id}`} className="group relative bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-amber-500/50 transition-all duration-300 block">
                        {/* Course Image */}
                        <div className="aspect-video relative overflow-hidden bg-gray-900">
                            <img
                                src={course.image}
                                alt={course.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-xs font-medium text-white border border-white/10">
                                {course.level}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-400 transition-colors line-clamp-1">{course.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>Updated {course.lastUpdated}</span>
                                    </div>
                                </div>
                                <button
                                    className="text-gray-400 hover:text-red-400 z-10 relative p-2"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
                                            await api.deleteCourse(course.id);
                                            loadCourses();
                                        }
                                    }}
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <Users className="w-4 h-4 text-amber-500" />
                                    <span>{course.students} Students</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${course.status === 'published' || course.status === 'Active'
                                    ? 'bg-green-500/10 text-green-400'
                                    : 'bg-yellow-500/10 text-yellow-400'
                                    }`}>
                                    {course.status === 'Active' ? 'Published' : (course.status?.charAt(0).toUpperCase() + course.status?.slice(1) || 'Draft')}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
