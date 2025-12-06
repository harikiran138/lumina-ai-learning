'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
    BookOpen,
    Search,
    Filter,
    Clock,
    MoreVertical,
    PlayCircle,
    CheckCircle
} from 'lucide-react';

export default function StudentCourses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            // Mock fetching enrolled courses
            const data = await api.getDashboardData('student');
            if (data && data.enrolledCourses) {
                setCourses(data.enrolledCourses);
            }
            setIsLoading(false);
        };
        fetchCourses();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Courses</h1>
                    <p className="text-gray-400">Manage and continue your active courses</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lumina-primary/50 w-full md:w-64"
                        />
                    </div>
                    <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-white">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course.id} className="glass-card group hover:border-lumina-primary/30 transition-all duration-300">
                            {/* Course Thumbnail */}
                            <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative rounded-t-xl overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center text-gray-700 group-hover:scale-105 transition-transform duration-500">
                                    <BookOpen className="w-16 h-16 opacity-20" />
                                </div>
                                <div className="absolute top-4 right-4">
                                    <button className="p-1.5 bg-black/40 backdrop-blur-md rounded-lg text-white hover:bg-black/60">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4">
                                    <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between text-xs text-white mb-1">
                                                <span>Progress</span>
                                                <span>{course.progress}%</span>
                                            </div>
                                            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-lumina-primary" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Course Info */}
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-lumina-primary transition-colors">{course.name}</h3>
                                    {course.progress === 100 && <CheckCircle className="w-5 h-5 text-green-500" />}
                                </div>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{course.description}</p>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>Last accessed 2d ago</span>
                                    </div>
                                    <Link href={`/student/courses/${course.id}`} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-lumina-primary hover:text-black border border-white/10 hover:border-transparent rounded-lg text-sm font-medium transition-all">
                                        <PlayCircle className="w-4 h-4" />
                                        Continue
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Mock Course Card */}
                    <Link href="/student/course_explorer" className="glass-card flex flex-col items-center justify-center p-8 border-dashed border-2 border-white/10 hover:border-lumina-primary/50 hover:bg-white/5 transition-all group cursor-pointer min-h-[350px]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-8 h-8 text-gray-400 group-hover:text-lumina-primary" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">Discover More</h3>
                        <p className="text-sm text-gray-500 text-center">Browse our catalog to find your next course</p>
                    </Link>
                </div>
            )}
        </div>
    );
}
