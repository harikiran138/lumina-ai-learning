'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Search, Filter, BookOpen, User, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CourseExplorerPage() {
    const router = useRouter();
    const [courses, setCourses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await api.getAllCourses();
                setCourses(data);
            } catch (error) {
                console.error('Failed to fetch courses', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleEnroll = async (courseId: string) => {
        setEnrollingId(courseId);
        try {
            const res = await api.enrollInCourse(courseId);
            if (res.success || res.error === 'Already enrolled in this course') {
                router.push('/student/courses');
            } else {
                alert(res.error || 'Failed to enroll');
            }
        } catch (error) {
            console.error('Enrollment error', error);
            alert('Something went wrong');
        } finally {
            setEnrollingId(null);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Course Explorer</h1>
                    <p className="text-gray-400">Discover new skills and knowledge</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search courses..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lumina-primary/50 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lumina-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className="glass-card group hover:border-lumina-primary/30 transition-all duration-300 flex flex-col h-full">
                            {/* Thumbnail */}
                            <div className="h-48 bg-gradient-to-br from-gray-800 to-gray-900 relative rounded-t-xl overflow-hidden">
                                {course.thumbnail ? (
                                    <img src={course.thumbnail} alt={course.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                                        <BookOpen className="w-16 h-16 opacity-20" />
                                    </div>
                                )}
                                <div className="absolute top-4 right-4">
                                    <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white border border-white/10">
                                        {course.level}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-lumina-primary transition-colors">{course.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-3 flex-1">{course.description}</p>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <User className="w-3.5 h-3.5" />
                                        <span>{course.enrolledCount} Students</span>
                                    </div>

                                    <button
                                        onClick={() => handleEnroll(course.id)}
                                        disabled={enrollingId === course.id}
                                        className="flex items-center gap-2 px-4 py-2 bg-lumina-primary text-black hover:bg-lumina-secondary rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {enrollingId === course.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                Enroll
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredCourses.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No courses found matching your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
