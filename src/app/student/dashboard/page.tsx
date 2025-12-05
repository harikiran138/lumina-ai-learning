'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Line, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import Link from 'next/link';
import { getChartColors } from '@/lib/utils';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

export default function StudentDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [chartColors, setChartColors] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            try {
                // Check theme for chart colors
                const isDark = document.documentElement.classList.contains('dark');
                setChartColors(getChartColors(isDark));

                // Fetch data
                const data = await api.getDashboardData('student');
                setDashboardData(data);
                setIsLoading(false);
            } catch (error: any) {
                console.error('Dashboard initialization error:', error);
                setError(error.message || 'An error occurred while loading the dashboard');
                setIsLoading(false);
            }
        };

        init();

        // Listen for theme changes to update charts
        const handleThemeChange = () => {
            const isDark = document.documentElement.classList.contains('dark');
            setChartColors(getChartColors(isDark));
        };

        // Mutation observer for class changes on html element
        const observer = new MutationObserver(handleThemeChange);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
                    <p className="text-gray-600 dark:text-gray-300">{error}</p>
                    <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const progressData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Learning Hours',
            data: [5, 8, 10, 14], // Mock data
            borderColor: chartColors?.primary || '#fbbf24',
            backgroundColor: chartColors?.background || 'rgba(251, 191, 36, 0.2)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: chartColors?.primary || '#fbbf24'
        }]
    };

    const masteryData = {
        labels: ['Mastered', 'To Improve'],
        datasets: [{
            data: [dashboardData?.overallMastery || 0, 100 - (dashboardData?.overallMastery || 0)],
            backgroundColor: [chartColors?.primary || '#fbbf24', '#e5e7eb'],
            borderWidth: 0
        }]
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
                    Welcome back, <span className="gradient-text">Student</span>!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Here's your personalized learning snapshot.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">CURRENT STREAK</span>
                        <span className="text-2xl">🔥</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.currentStreak || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Days in a row</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">ENROLLED</span>
                        <span className="text-2xl">📚</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.enrolledCourses?.length || 0}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Active courses</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">TOTAL HOURS</span>
                        <span className="text-2xl">⏱️</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">12</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Learning time</p>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-amber-500/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">MASTERY</span>
                        <span className="text-2xl">🎯</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{dashboardData?.overallMastery || 0}%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Average %</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Learning Progress This Month</h2>
                    <div className="h-64">
                        <Line
                            data={progressData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        grid: { color: chartColors?.grid },
                                        ticks: { color: chartColors?.text }
                                    },
                                    x: {
                                        grid: { color: chartColors?.grid },
                                        ticks: { color: chartColors?.text }
                                    }
                                },
                                plugins: {
                                    legend: { labels: { color: chartColors?.text } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link href="/student/ai_tutor" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-amber-500/20">
                            <span className="text-2xl">🤖</span>
                            <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">Ask AI Tutor</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Get instant help</p>
                            </div>
                        </Link>
                        <Link href="/student/assessment" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-amber-500/20">
                            <span className="text-2xl">✏️</span>
                            <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">Take Quiz</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Test your knowledge</p>
                            </div>
                        </Link>
                        <Link href="/student/my_notes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-amber-500/20">
                            <span className="text-2xl">📝</span>
                            <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white">View Notes</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Review your notes</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Continue Learning */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Continue Learning</h2>
                    <Link href="/student/course_explorer" className="text-amber-500 hover:text-amber-600 font-semibold">View All →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData?.enrolledCourses?.length > 0 ? (
                        dashboardData.enrolledCourses.slice(0, 3).map((course: any) => (
                            <div key={course.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow">
                                <div className="h-40 bg-gray-200 dark:bg-gray-800 relative">
                                    {/* Placeholder for course image */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        <BookOpen className="w-12 h-12" />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{course.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-gray-500 dark:text-gray-400">Progress</span>
                                            <span className="text-amber-500">{course.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full" style={{ width: `${course.progress || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-3 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-2"><span>🎯</span>{course.mastery || 0}% mastery</div>
                                        <div>🔥 {course.streak || 0}</div>
                                    </div>
                                    <Link href={`/student/course/${course.id}`} className="block text-center px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors">
                                        Continue Learning
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-8 bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400 mb-4">No courses yet. Start learning today!</p>
                            <Link href="/student/course_explorer" className="px-4 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition-colors">
                                Explore Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Topic Mastery</h3>
                    <div className="h-48 flex justify-center">
                        <Doughnut
                            data={masteryData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: chartColors?.text } }
                                }
                            }}
                        />
                    </div>
                    <div className="mt-4 text-center">
                        <Link href="/student/progress" className="text-sm font-medium text-amber-500 hover:text-amber-600">View Detailed Progress →</Link>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Your Achievements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="w-12 h-12 mx-auto mb-2 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-sm">
                                👶
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">First Step</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                            <div className="w-12 h-12 mx-auto mb-2 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-sm">
                                🔥
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">7-Day Streak</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800 opacity-50">
                            <div className="w-12 h-12 mx-auto mb-2 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-sm grayscale">
                                🏆
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Course Master</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800 opacity-50">
                            <div className="w-12 h-12 mx-auto mb-2 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl shadow-sm grayscale">
                                🧠
                            </div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">Quiz Whiz</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function BookOpen({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
    );
}
