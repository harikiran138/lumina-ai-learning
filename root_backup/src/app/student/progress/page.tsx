'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Trophy,
    Flame,
    Target,
    TrendingUp,
    BookOpen,
    Clock,
    Award,
    Star
} from 'lucide-react';

export default function StudentProgress() {
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgress = async () => {
            const res = await api.getStudentProgress();
            setData(res);
            setIsLoading(false);
        };
        fetchProgress();
    }, []);

    if (isLoading) return <div className="text-white text-center p-10">Loading progress...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Learning Progress</h1>
                    <p className="text-gray-400">Track your journey and achievements</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-500/20 rounded-lg">
                            <Flame className="w-6 h-6 text-amber-500" />
                        </div>
                        <span className="text-xs font-semibold text-green-400">+12%</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-400">Current Streak</p>
                        <p className="text-2xl font-bold text-white">{data?.stats?.currentStreak || 0} Days</p>
                    </div>
                </div>

                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Trophy className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">Level 5</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-400">Total XP</p>
                        <p className="text-2xl font-bold text-white">{data?.stats?.totalXP || 0}</p>
                    </div>
                </div>

                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Target className="w-6 h-6 text-purple-500" />
                        </div>
                        <span className="text-xs font-semibold text-green-400">{data?.stats?.avgAccuracy || 0}%</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-400">Avg. Accuracy</p>
                        <p className="text-2xl font-bold text-white">{data?.stats?.avgAccuracy > 90 ? 'A+' : 'A'}</p>
                    </div>
                </div>

                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <Clock className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-xs font-semibold text-gray-400">Total</span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-400">Learning Time</p>
                        <p className="text-2xl font-bold text-white">{data?.stats?.learningTime || '0h 0m'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Info */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Detailed Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-lumina-primary" />
                            Weekly Activity
                        </h2>
                        {/* Mock Chart Area */}
                        <div className="h-64 bg-white/5 rounded-xl flex items-end justify-between p-4 gap-2">
                            {(data?.weeklyActivity || [0, 0, 0, 0, 0, 0, 0]).map((h: number, i: number) => (
                                <div key={i} className="w-full bg-lumina-primary/20 hover:bg-lumina-primary/40 rounded-t-lg transition-all relative group" style={{ height: `${h > 100 ? 100 : h}%` }}>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                                        {h}m
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-sm text-gray-400">
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-lumina-primary" />
                            Recent Courses Interaction
                        </h2>
                        <div className="space-y-4">
                            {data?.recentCourses?.map((course: any, i: number) => (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 rounded-lg bg-lumina-primary/20 flex items-center justify-center text-lumina-primary">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-white font-medium">{course.courseName}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex-1 h-1.5 bg-white/10 rounded-full">
                                                <div className="h-full bg-lumina-primary rounded-full" style={{ width: `${course.progress}%` }}></div>
                                            </div>
                                            <span className="text-xs text-gray-400">{course.progress}%</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500">Recently</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Achievements Side Panel */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            Achievements
                        </h2>
                        <span className="text-sm text-lumina-primary cursor-pointer hover:underline">View All</span>
                    </div>

                    <div className="space-y-4">
                        {data?.achievements?.map((ach: any, i: number) => {
                            const Icon = ach.icon === 'Star' ? Star :
                                ach.icon === 'Flame' ? Flame :
                                    ach.icon === 'Trophy' ? Trophy :
                                        ach.icon === 'BookOpen' ? BookOpen : Award;

                            return (
                                <div key={i} className={`p-4 rounded-xl border ${ach.unlocked ? 'bg-white/5 border-white/10' : 'bg-white/0 border-white/5 opacity-50'} flex gap-4 transition-all hover:border-lumina-primary/30`}>
                                    <div className={`p-2 rounded-lg ${ach.unlocked ? 'bg-white/10' : 'bg-white/5'}`}>
                                        <Icon className={`w-5 h-5 ${ach.color || 'text-gray-400'}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-white text-sm font-medium">{ach.title}</h4>
                                        <p className="text-xs text-gray-400">{ach.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {(!data?.achievements || data.achievements.length === 0) && (
                            <p className="text-gray-500 text-sm">No achievements data.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
