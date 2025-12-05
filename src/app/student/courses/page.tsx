'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StudentCoursesPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            // Wait for dependencies
            let attempts = 0;
            while ((!(window as any).luminaDB || !(window as any).luminaAPI) && attempts < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!(window as any).luminaDB) {
                setError('Failed to load system dependencies. Please refresh.');
                setIsLoading(false);
                return;
            }

            try {
                const user = await (window as any).luminaDB.getCurrentUser();
                if (!user) {
                    window.location.href = '/login';
                    return;
                }

                if ((window as any).luminaAPI) {
                    // Start by getting dashboard data which often includes enrolled courses
                    // Or fetch directly if an API exists, for now we will assume getDashboardData returns them or use DB directly

                    // Option A: Use getDashboardData
                    const dashboardData = await (window as any).luminaAPI.getDashboardData('student');
                    if (dashboardData && dashboardData.enrolledCourses) {
                        setCourses(dashboardData.enrolledCourses);
                    } else {
                        // Option B: Fallback to DB if API structure differs
                        // This logic mimics what the API likely does
                        const allCourses = await (window as any).luminaDB.getAll('courses');
                        // Filter for courses the user is enrolled in (mock logic if not in user object)
                        // In the current seed, we might just show all or random for demo
                        // Let's rely on dashboardData for consistency first
                        if (!dashboardData?.enrolledCourses) {
                            setCourses([]);
                        }
                    }
                }
                setIsLoading(false);
            } catch (err: any) {
                console.error('Error fetching courses:', err);
                setError('Failed to load your courses.');
                setIsLoading(false);
            }
        };

        init();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
                    <p>Loading your courses...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-8 lg:ml-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">My <span className="text-lumina-primary">Courses</span></h1>
                    <p className="text-gray-400">Continue your learning journey.</p>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                {courses.length === 0 && !error ? (
                    <div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10">
                        <div className="text-6xl mb-4">📚</div>
                        <h2 className="text-2xl font-bold mb-2">No courses yet</h2>
                        <p className="text-gray-400 mb-6">You haven't enrolled in any courses yet.</p>
                        <Link
                            href="/student/course_explorer"
                            suppressHydrationWarning
                            className="inline-block px-6 py-3 bg-lumina-primary text-black font-bold rounded-lg hover:bg-lumina-secondary transition-colors"
                        >
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <div key={course.id} className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-lumina-primary/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg hover:shadow-lumina-primary/20">
                                <div className="h-48 bg-gray-800 relative overflow-hidden">
                                    {/* Use a placeholder if image is missing, or the course image */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                                    <img
                                        src={course.image || 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80'}
                                        alt={course.name}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute bottom-4 left-4 z-20">
                                        <span className="text-xs font-bold px-2 py-1 bg-lumina-primary text-black rounded mb-2 inline-block">
                                            {course.level || 'All Levels'}
                                        </span>
                                        <h3 className="text-xl font-bold text-white leading-tight">{course.name}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
                                        <div className="flex items-center">
                                            <span>⏱️ {course.duration || '4 weeks'}</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span>👥 {course.members?.length || 0} students</span>
                                        </div>
                                    </div>

                                    {/* Progress Bar (Mock for now, could be real data) */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                            <span>Progress</span>
                                            <span>{course.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-lumina-primary h-2 rounded-full transition-all duration-1000"
                                                style={{ width: `${course.progress || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <Link
                                        href={`/student/course/${course.id}`}
                                        suppressHydrationWarning
                                        className="block w-full py-3 text-center bg-white/10 hover:bg-lumina-primary hover:text-black text-white font-medium rounded-lg transition-colors"
                                    >
                                        Continue Learning
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
