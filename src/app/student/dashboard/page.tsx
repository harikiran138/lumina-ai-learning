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
import {
    Flame,
    BookOpen,
    Clock,
    Target,
    Bot,
    PenTool,
    FileText,
    Trophy,
    Brain,
    Footprints,
    Star,
    Award
} from 'lucide-react';
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
                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">CURRENT STREAK</span>
                        <Flame className="w-6 h-6 text-amber-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData?.currentStreak || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Days in a row</p>
                </div>

                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">ENROLLED</span>
                        <BookOpen className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData?.enrolledCourses?.length || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Active courses</p>
                </div>

                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">TOTAL HOURS</span>
                        <Clock className="w-6 h-6 text-emerald-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData?.totalHours || 0}</p>
                    <p className="text-xs text-gray-400 mt-1">Learning time</p>
                </div>

                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400">MASTERY</span>
                        <Target className="w-6 h-6 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-white">{dashboardData?.overallMastery || 0}%</p>
                    <p className="text-xs text-gray-400 mt-1">Average %</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4 text-white">Learning Progress This Month</h2>
                    <div className="h-64">
                        <Line
                            data={progressData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                                    },
                                    x: {
                                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                                        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
                                    }
                                },
                                plugins: {
                                    legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4 text-white">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link href="/student/ai_tutor" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-lumina-primary/20">
                            <Bot className="w-6 h-6 text-lumina-primary" />
                            <div>
                                <p className="font-semibold text-sm text-white">Ask AI Tutor</p>
                                <p className="text-xs text-gray-400">Get instant help</p>
                            </div>
                        </Link>
                        <Link href="/student/assessment" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-lumina-primary/20">
                            <PenTool className="w-6 h-6 text-purple-400" />
                            <div>
                                <p className="font-semibold text-sm text-white">Take Quiz</p>
                                <p className="text-xs text-gray-400">Test your knowledge</p>
                            </div>
                        </Link>
                        <Link href="/student/my_notes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-lumina-primary/20">
                            <FileText className="w-6 h-6 text-green-400" />
                            <div>
                                <p className="font-semibold text-sm text-white">View Notes</p>
                                <p className="text-xs text-gray-400">Review your notes</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Continue Learning */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Continue Learning</h2>
                    <Link href="/student/courses" className="text-amber-500 hover:text-amber-600 font-semibold">View All →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData?.enrolledCourses?.length > 0 ? (
                        dashboardData.enrolledCourses.slice(0, 3).map((course: any) => (
                            <div key={course.id} className="glass-card overflow-hidden hover:shadow-gold-glow transition-shadow">
                                <div className="h-40 bg-white/5 relative">
                                    {/* Placeholder for course image */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                        <BookOpen className="w-12 h-12" />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-2 text-white">{course.name}</h3>
                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                                    <div className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-gray-400">Progress</span>
                                            <span className="text-lumina-primary">{course.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-2">
                                            <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full" style={{ width: `${course.progress || 0}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-3 text-sm text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            {course.mastery || 0}% mastery
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Flame className="w-4 h-4" />
                                            {course.streak || 0}
                                        </div>
                                    </div>
                                    <Link href={`/student/courses/${course.id}`} className="glass-button block text-center">
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
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white">Topic Mastery</h3>
                    <div className="h-48 flex justify-center">
                        <Doughnut
                            data={masteryData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: 'rgba(255, 255, 255, 0.7)' } }
                                }
                            }}
                        />
                    </div>
                    <div className="mt-4 text-center">
                        <Link href="/student/progress" className="text-sm font-medium text-amber-500 hover:text-amber-600">View Detailed Progress →</Link>
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white">Your Achievements</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {dashboardData?.achievements?.map((ach: any, i: number) => {
                            const Icon = ach.icon === 'Star' ? Star :
                                ach.icon === 'Flame' ? Flame :
                                    ach.icon === 'Trophy' ? Trophy :
                                        ach.icon === 'BookOpen' ? BookOpen : Award;

                            return (
                                <div key={i} className={`text-center p-4 rounded-lg bg-white/5 ${!ach.unlocked && 'opacity-50'}`}>
                                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center shadow-sm ${ach.unlocked ? 'bg-white/10' : 'bg-white/5'}`}>
                                        <Icon className={`w-6 h-6 ${ach.unlocked ? (ach.color || 'text-lumina-primary') : 'text-gray-400'}`} />
                                    </div>
                                    <p className="text-xs font-semibold text-white">{ach.title}</p>
                                </div>
                            );
                        })}
                        {(!dashboardData?.achievements || dashboardData.achievements.length === 0) && (
                            <div className="col-span-4 text-center text-gray-500 text-sm">No achievements data.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
