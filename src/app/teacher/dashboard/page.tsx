'use client';

import { useEffect, useState } from 'react';

export default function TeacherDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);

    useEffect(() => {
        console.log('Teacher Dashboard Mounted');
        const init = async () => {
            if (typeof window === 'undefined') return;

            // Wait for global objects to be available
            let attempts = 0;
            while ((!(window as any).luminaDB || !(window as any).navigationManager || !(window as any).luminaAPI) && attempts < 50) {
                console.log('Waiting for global scripts...', attempts);
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }

            if (!(window as any).luminaDB) {
                console.error('LuminaDB not loaded');
                setError('Failed to load database. Please refresh the page.');
                setIsLoading(false);
                return;
            }

            try {
                console.log('Initializing managers...');
                // Initialize managers
                await (window as any).luminaDB.init();
                if ((window as any).navigationManager) await (window as any).navigationManager.init();

                // Populate navigation
                const topNavContainer = document.getElementById('top-nav-container');
                const sidebarContainer = document.getElementById('sidebar-container');
                const currentUser = await (window as any).luminaDB.getCurrentUser();
                console.log('Current User:', currentUser);

                if (!currentUser) {
                    console.log('No user found, redirecting to login');
                    window.location.href = '/login';
                    return;
                }

                if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
                    console.log('Invalid role, redirecting to student dashboard');
                    window.location.href = '/student/dashboard';
                    return;
                }

                if (topNavContainer && (window as any).navigationManager) {
                    topNavContainer.innerHTML = (window as any).navigationManager.generateTopNav('teacher');
                }
                if (sidebarContainer && (window as any).navigationManager) {
                    sidebarContainer.innerHTML = (window as any).navigationManager.generateSidebar('teacher');
                }
                if ((window as any).navigationManager) {
                    (window as any).navigationManager.setupEventListeners();
                }

                // Update user name
                const shortName = currentUser.name.split(' ')[0];
                const userNameEls = document.querySelectorAll('#user-name');
                userNameEls.forEach(el => el.textContent = shortName);

                // Fetch Dashboard Data
                if ((window as any).luminaAPI) {
                    console.log('Fetching dashboard data...');
                    const data = await (window as any).luminaAPI.getDashboardData('teacher');
                    console.log('Dashboard Data:', data);
                    setDashboardData(data);
                }

                setIsLoading(false);

            } catch (error: any) {
                console.error('Dashboard initialization error:', error);
                setError(error.message || 'An error occurred while loading the dashboard');
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
                    <p>Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white">
                <div className="text-center p-8 bg-red-100 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-500/50">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-500 mb-2">Error</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx global>{`
                .gradient-text {
                    background: linear-gradient(135deg, #FFD700 0%, #FDB931 100%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>

            <div id="top-nav-container"></div>
            <div className="flex bg-black min-h-screen text-white relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[20%] left-[10%] w-[30%] h-[30%] bg-lumina-primary/5 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-lumina-secondary/5 rounded-full blur-[100px]"></div>
                </div>
                <div id="sidebar-container"></div>
                <main className="flex-1 pt-20 pb-8 transition-all duration-300 lg:ml-64">
                    <div className="container mx-auto px-4 lg:px-8">
                        <div className="mb-8 relative z-10">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                                Welcome back, <span className="gradient-text" id="user-name">Teacher</span>!
                            </h1>
                            <p className="text-gray-400">Here's what's happening in your classes today.</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                            <div className="card hover:border-lumina-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-blue-900/30 rounded-lg text-blue-400">
                                        👥
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase">Total Students</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white">{dashboardData?.studentProgress?.length || 0}</h3>
                                <p className="text-sm text-green-400 mt-2">Active learners</p>
                            </div>

                            <div className="card hover:border-lumina-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-amber-900/30 rounded-lg text-amber-400">
                                        📚
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase">Active Courses</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white">{dashboardData?.enrolledCourses?.length || 0}</h3>
                                <p className="text-sm text-gray-400 mt-2">Courses managed</p>
                            </div>

                            <div className="card hover:border-lumina-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-green-900/30 rounded-lg text-green-400">
                                        🎯
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase">Avg Mastery</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white">{dashboardData?.overallMastery || 0}%</h3>
                                <p className="text-sm text-green-400 mt-2">+2.4% this week</p>
                            </div>

                            <div className="card hover:border-lumina-primary/50 transition-colors">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-purple-900/30 rounded-lg text-purple-400">
                                        📝
                                    </div>
                                    <span className="text-xs font-semibold text-gray-400 uppercase">To Grade</span>
                                </div>
                                <h3 className="text-3xl font-bold text-white">5</h3>
                                <p className="text-sm text-amber-400 mt-2">Pending assessments</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                            {/* Course List */}
                            <div className="lg:col-span-2 space-y-6">
                                <div className="card overflow-hidden">
                                    <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white">Your Courses</h2>
                                        <a href="/teacher/courses" className="text-sm text-lumina-primary hover:text-lumina-secondary font-medium">View All</a>
                                    </div>
                                    <div className="divide-y divide-gray-800">
                                        {dashboardData?.enrolledCourses?.length > 0 ? (
                                            dashboardData.enrolledCourses.map((course: any) => (
                                                <div key={course.id} className="p-6 hover:bg-white/5 transition-colors">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex gap-4">
                                                            <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden">
                                                                <img src={course.image} alt={course.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-white mb-1">{course.name}</h3>
                                                                <p className="text-sm text-gray-400 mb-2">{course.level} • {course.members.length} Students</p>
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <span className="px-2 py-1 rounded-full bg-green-900/30 text-green-400">Active</span>
                                                                    <span className="text-gray-500">•</span>
                                                                    <span className="text-gray-500">Updated 2 days ago</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="p-2 text-gray-400 hover:text-lumina-primary transition-colors">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-gray-400">
                                                No courses found. <a href="/teacher/create-course" className="text-lumina-primary hover:underline">Create your first course</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity / Quick Actions */}
                            <div className="space-y-6">
                                <div className="card p-6">
                                    <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                                    <div className="space-y-3">
                                        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left border border-transparent hover:border-lumina-primary/20">
                                            <div className="p-2 bg-amber-900/30 rounded-lg text-amber-400">
                                                📤
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">Upload Content</p>
                                                <p className="text-xs text-gray-400">Add new materials</p>
                                            </div>
                                        </button>
                                        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left border border-transparent hover:border-lumina-primary/20">
                                            <div className="p-2 bg-blue-900/30 rounded-lg text-blue-400">
                                                ✏️
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">Create Assessment</p>
                                                <p className="text-xs text-gray-400">New quiz or exam</p>
                                            </div>
                                        </button>
                                        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left border border-transparent hover:border-lumina-primary/20">
                                            <div className="p-2 bg-purple-900/30 rounded-lg text-purple-400">
                                                📢
                                            </div>
                                            <div>
                                                <p className="font-semibold text-white">Announcement</p>
                                                <p className="text-xs text-gray-400">Notify students</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div className="card p-6">
                                    <h2 className="text-xl font-bold text-white mb-4">Student Progress</h2>
                                    <div className="space-y-4">
                                        {dashboardData?.studentProgress?.slice(0, 3).map((progress: any, i: number) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
                                                    S{i + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <p className="text-sm font-medium text-white">Student {i + 1}</p>
                                                        <span className="text-xs text-gray-400">{progress.mastery}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-800 rounded-full h-1.5">
                                                        <div className="bg-lumina-primary h-1.5 rounded-full" style={{ width: `${progress.mastery}%` }}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {!dashboardData?.studentProgress?.length && (
                                            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
