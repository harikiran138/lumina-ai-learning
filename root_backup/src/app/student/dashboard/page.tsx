'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Line, Doughnut, Pie } from 'react-chartjs-2';
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

    // Process real data for charts
    const weeklyActivity = dashboardData?.weeklyActivity || [];
    const weeks = weeklyActivity.map((w: any) => `Week ${w.week}`);
    const timeSpent = weeklyActivity.map((w: any) => w.timeSpent || 0);

    const progressData = {
        labels: weeks.length > 0 ? weeks : ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Learning Hours',
            data: timeSpent.length > 0 ? timeSpent : [0, 0, 0, 0],
            borderColor: chartColors?.primary || '#fbbf24',
            backgroundColor: chartColors?.background || 'rgba(251, 191, 36, 0.2)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: chartColors?.primary || '#fbbf24'
        }]
    };

    // Calculate course progress distribution
    const enrolledCourses = dashboardData?.enrolledCourses || [];
    const notStarted = enrolledCourses.filter((c: any) => (c.progress || 0) === 0).length;
    const inProgress = enrolledCourses.filter((c: any) => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;
    const completed = enrolledCourses.filter((c: any) => (c.progress || 0) === 100).length;

    const courseStatusData = {
        labels: ['Not Started', 'In Progress', 'Completed'],
        datasets: [{
            data: [notStarted, inProgress, completed],
            backgroundColor: [
                'rgba(156, 163, 175, 0.5)', // Gray for Not Started
                chartColors?.primary || '#fbbf24', // Primary for In Progress
                'rgba(16, 185, 129, 0.8)'  // Green for Completed
            ],
            borderColor: [
                'rgba(156, 163, 175, 1)',
                chartColors?.primary || '#fbbf24',
                'rgba(16, 185, 129, 1)'
            ],
            borderWidth: 1
        }]
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                    Welcome back, <span className="gradient-text">{dashboardData?.studentName || 'Student'}</span>!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Here's your personalized learning snapshot.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-amber-500 transition-colors">CURRENT STREAK</span>
                        <Flame className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{dashboardData?.currentStreak || 0}</p>
                    <p className="text-xs text-gray-400">Days in a row</p>
                </div>

                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-blue-500 transition-colors">ENROLLED</span>
                        <BookOpen className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{dashboardData?.enrolledCourses?.length || 0}</p>
                    <p className="text-xs text-gray-400">Active courses</p>
                </div>

                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-emerald-500 transition-colors">TOTAL HOURS</span>
                        <Clock className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{dashboardData?.totalHours || 0}</p>
                    <p className="text-xs text-gray-400">Learning time</p>
                </div>

                <div className="glass-card p-5 hover:border-lumina-primary/50 transition-colors group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-purple-500 transition-colors">MASTERY</span>
                        <Target className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{dashboardData?.overallMastery || 0}%</p>
                    <p className="text-xs text-gray-400">Average %</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Progress Chart */}
                <div className="lg:col-span-2 glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-lumina-primary" />
                        Learning Activity
                    </h2>
                    <div className="h-64">
                        <Line
                            data={progressData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                                    },
                                    x: {
                                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                                        ticks: { color: 'rgba(255, 255, 255, 0.5)' }
                                    }
                                },
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        titleColor: '#fbbf24',
                                        bodyColor: '#fff',
                                        padding: 12,
                                        cornerRadius: 8,
                                        displayColors: false
                                    }
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-6">
                    <h2 className="text-lg font-semibold mb-4 text-white">Quick Actions</h2>
                    <div className="space-y-3">
                        <Link href="/student/ai_tutor" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-lumina-primary/30 group">
                            <div className="w-10 h-10 rounded-lg bg-lumina-primary/10 flex items-center justify-center text-lumina-primary group-hover:scale-110 transition-transform">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-white group-hover:text-lumina-primary transition-colors">Ask AI Tutor</p>
                                <p className="text-xs text-gray-400">Get instant help</p>
                            </div>
                        </Link>
                        <Link href="/student/assessment" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-purple-500/30 group">
                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                                <PenTool className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-white group-hover:text-purple-400 transition-colors">Take Quiz</p>
                                <p className="text-xs text-gray-400">Test your knowledge</p>
                            </div>
                        </Link>
                        <Link href="/student/my_notes" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-transparent hover:border-green-500/30 group">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-white group-hover:text-green-400 transition-colors">View Notes</p>
                                <p className="text-xs text-gray-400">Review your notes</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Continue Learning */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-white">Continue Learning</h2>
                    <Link href="/student/courses" className="text-sm font-bold text-lumina-primary hover:text-amber-400 px-4 py-2 bg-lumina-primary/10 rounded-lg transition-colors">View All →</Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData?.enrolledCourses?.length > 0 ? (
                        dashboardData.enrolledCourses.slice(0, 3).map((course: any) => (
                            <div key={course.id} className="glass-card overflow-hidden hover:shadow-gold-glow transition-all group">
                                <div className="h-40 bg-white/5 relative overflow-hidden">
                                    {/* Background Gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent z-0"></div>

                                    {/* Icon */}
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-600 group-hover:text-lumina-primary/50 transition-colors">
                                        <BookOpen className="w-16 h-16 opacity-30 group-hover:scale-110 transition-transform duration-500" />
                                    </div>

                                    <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                                        <span className="text-xs font-bold text-lumina-primary">{course.subject || 'Course'}</span>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-bold text-lg mb-2 text-white line-clamp-1 group-hover:text-lumina-primary transition-colors">{course.name}</h3>
                                    <p className="text-sm text-gray-400 mb-4 line-clamp-2">{course.description}</p>

                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-semibold text-gray-400">Progress</span>
                                            <span className="text-lumina-primary font-mono">{course.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-gradient-to-r from-amber-400 to-amber-600 h-full rounded-full transition-all duration-1000" style={{ width: `${course.progress || 0}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mb-4 text-xs text-gray-400 border-t border-white/5 pt-3">
                                        <div className="flex items-center gap-1.5" title="Mastery Level">
                                            <Target className="w-3.5 h-3.5 text-purple-400" />
                                            {course.mastery || 0}%
                                        </div>
                                        <div className="flex items-center gap-1.5" title="Day Streak">
                                            <Flame className="w-3.5 h-3.5 text-orange-400" />
                                            {course.streak || 0}d
                                        </div>
                                    </div>

                                    <Link href={`/student/courses/${course.id}`} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-lumina-primary text-gray-300 hover:text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-lumina-primary/20">
                                        Continue Learning
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
                            <p className="text-gray-400 mb-4 text-lg">No courses yet. Start your journey today!</p>
                            <Link href="/student/course_explorer" className="px-6 py-2 bg-lumina-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg shadow-lumina-primary/20">
                                Explore Courses
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                        <Target className="w-5 h-5 text-lumina-primary" />
                        Course Status
                    </h3>
                    <div className="h-56 flex justify-center relative">
                        <Pie
                            data={courseStatusData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: 'rgba(255, 255, 255, 0.7)',
                                            usePointStyle: true,
                                            padding: 20
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: function (context) {
                                                const label = context.label || '';
                                                const value = context.raw || 0;
                                                const total = context.dataset.data.reduce((a: any, b: any) => a + b, 0);
                                                const percentage = Math.round(((value as number) / (total as number)) * 100) + '%';
                                                return `${label}: ${value} (${percentage})`;
                                            }
                                        }
                                    }
                                },
                                elements: {
                                    arc: {
                                        borderWidth: 2,
                                        borderColor: '#1a1a1a' // Match background
                                    }
                                }
                            }}
                        />
                        {enrolledCourses.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <p className="text-xs text-gray-500">No data</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-lumina-primary" />
                        Achievements
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {dashboardData?.achievements?.map((ach: any, i: number) => {
                            const Icon = ach.icon === 'Star' ? Star :
                                ach.icon === 'Flame' ? Flame :
                                    ach.icon === 'Trophy' ? Trophy :
                                        ach.icon === 'BookOpen' ? BookOpen : Award;

                            return (
                                <div key={i} className={`text-center p-4 rounded-xl border transition-all ${ach.unlocked
                                    ? 'bg-lumina-primary/5 border-lumina-primary/20 hover:bg-lumina-primary/10'
                                    : 'bg-white/5 border-transparent opacity-60 grayscale'
                                    }`}>
                                    <div className={`w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center shadow-lg ${ach.unlocked ? 'bg-gradient-to-br from-lumina-primary to-amber-600 text-black' : 'bg-gray-800 text-gray-500'
                                        }`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-white mb-1 line-clamp-1">{ach.title}</p>
                                    <p className="text-[10px] text-gray-400 line-clamp-1">{ach.unlocked ? 'Unlocked' : 'Locked'}</p>
                                </div>
                            );
                        })}
                        {(!dashboardData?.achievements || dashboardData.achievements.length === 0) && (
                            <div className="col-span-4 text-center py-8">
                                <Trophy className="w-12 h-12 mx-auto text-gray-700 mb-2" />
                                <p className="text-gray-500 text-sm">No achievements data found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
