
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Users, BookOpen, BarChart2, FileText, Upload, PlusCircle, Bell, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Teacher Dashboard | Lumina',
    description: 'Manage your classes and students',
};

async function getTeacherStats() {
    try {
        // Use Firebase-backed Server Action for general data
        const { getTeacherDashboard } = await import('@/app/actions/data');
        const data = await getTeacherDashboard('teacher@lumina.com');

        // Fetch Assessment Stats from FastAPI Backend
        interface AssessmentStats {
            avg_mastery: number;
            total_students?: number;
        }
        let masteryData: AssessmentStats = { avg_mastery: 0 };
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/assessment/stats/teacher`, { cache: 'no-store' });
            if (res.ok) {
                masteryData = await res.json();
            }
        } catch (err) {
            console.error("Failed to fetch assessment stats", err);
        }

        if (!data) {
            return {
                totalStudents: masteryData.total_students || 0,
                activeCourses: 0,
                avgMastery: Math.round(masteryData.avg_mastery || 0),
                pendingGrading: 0
            };
        }

        return {
            totalStudents: data.totalStudents || masteryData.total_students || 0,
            activeCourses: data.activeCourses || 0,
            avgMastery: Math.round(masteryData.avg_mastery || (data.avgRating ? data.avgRating * 20 : 0)),
            pendingGrading: 5
        };
    } catch (e) {
        console.error("Failed to fetch stats", e);
        return {
            totalStudents: 0,
            activeCourses: 0,
            avgMastery: 0,
            pendingGrading: 0
        };
    }
}

export default async function TeacherDashboard() {
    const stats = await getTeacherStats();

    return (
        <>
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Teacher</span>!
                </h1>
                <p className="text-gray-400">Here's what's happening in your classes today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                <StatCard
                    icon={Users}
                    color="blue"
                    label="Total Students"
                    value={stats.totalStudents}
                    subtext="Active learners"
                    trend="+12% this month"
                />
                <StatCard
                    icon={BookOpen}
                    color="amber"
                    label="Active Courses"
                    value={stats.activeCourses}
                    subtext="Courses managed"
                />
                <StatCard
                    icon={BarChart2}
                    color="green"
                    label="Avg Mastery"
                    value={`${stats.avgMastery}%`}
                    subtext="Class performance"
                    trend="+2.4% this week"
                />
                <StatCard
                    icon={FileText}
                    color="purple"
                    label="To Grade"
                    value={stats.pendingGrading}
                    subtext="Pending assessments"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Course List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Your Courses</h2>
                            <a href="/teacher/courses" className="text-sm text-amber-500 hover:text-amber-400 font-medium">View All</a>
                        </div>
                        <div className="divide-y divide-white/10">
                            {/* Placeholder Course Items */}
                            <CourseItem
                                name="Advanced Artificial Intelligence"
                                level="Graduate"
                                students={42}
                                status="Active"
                                image="https://placehold.co/600x400/2a2a2a/FFF?text=AI"
                            />
                            <CourseItem
                                name="Introduction to Machine Learning"
                                level="Undergraduate"
                                students={128}
                                status="Active"
                                image="https://placehold.co/600x400/1a1a1a/FFF?text=ML"
                            />
                            <CourseItem
                                name="Neural Networks Deep Dive"
                                level="Advanced"
                                students={15}
                                status="Draft"
                                image="https://placehold.co/600x400/333/FFF?text=NN"
                            />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <QuickActionButton
                                icon={Upload}
                                color="amber"
                                title="Upload Content"
                                subtitle="Add new materials"
                            />
                            <QuickActionButton
                                icon={PlusCircle}
                                color="blue"
                                title="Create Assessment"
                                subtitle="New quiz or exam"
                            />
                            <QuickActionButton
                                icon={Bell}
                                color="purple"
                                title="Announcement"
                                subtitle="Notify students"
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Recent Assignments Section */}
            <div className="mt-8 relative z-10">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-white">Recent Assignments</h2>
                        <a href="/teacher/assignments/create" className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                            <PlusCircle size={16} />
                            Create New
                        </a>
                    </div>
                    <div className="p-6">
                        <AssignmentsList />
                    </div>
                </div>
            </div>
        </>
    );
}

async function getAssignments() {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/assignments/list`, { cache: 'no-store' });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error("Failed to fetch assignments", e);
        return [];
    }
}

async function AssignmentsList() {
    const assignments = await getAssignments();

    if (assignments.length === 0) {
        return <p className="text-gray-400 text-center py-4">No assignments created yet.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="text-gray-400 border-b border-white/10">
                        <th className="pb-3 text-sm font-medium">Title</th>
                        <th className="pb-3 text-sm font-medium">Course</th>
                        <th className="pb-3 text-sm font-medium">Due Date</th>
                        <th className="pb-3 text-sm font-medium">Description</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {assignments.map((asm: any) => (
                        <tr key={asm.id} className="group hover:bg-white/5 transition-colors">
                            <td className="py-4 text-white font-medium pl-2">{asm.title}</td>
                            <td className="py-4 text-gray-400">{asm.course_id}</td>
                            <td className="py-4 text-gray-400">
                                {new Date(asm.due_date).toLocaleDateString()}
                                <span className="ml-2 text-xs text-gray-500">
                                    {new Date(asm.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </td>
                            <td className="py-4 text-gray-500 text-sm max-w-md truncate">{asm.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Helper Components

function StatCard({ icon: Icon, color, label, value, subtext, trend }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-900/30 text-blue-400',
        amber: 'bg-amber-900/30 text-amber-400',
        green: 'bg-green-900/30 text-green-400',
        purple: 'bg-purple-900/30 text-purple-400',
    };

    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-amber-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="text-xs font-semibold text-green-400 flex items-center">
                        <ArrowUpRight size={12} className="mr-1" />
                        {trend.split(' ')[0]}
                    </span>
                )}
            </div>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            <p className="text-sm text-gray-400 mt-2">{subtext}</p>
        </div>
    );
}

function CourseItem({ name, level, students, status, image }: any) {
    return (
        <div className="p-6 hover:bg-white/5 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden relative">
                        {/* Using a simple div placeholder if image fails, but logic implies valid src */}
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-1">{name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{level} • {students} Students</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className={`px-2 py-1 rounded-full ${status === 'Active' ? 'bg-green-900/30 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                                {status}
                            </span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">Updated recently</span>
                        </div>
                    </div>
                </div>
                <button className="p-2 text-gray-400 hover:text-amber-500 transition-colors" suppressHydrationWarning>
                    <ArrowDownRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}

function QuickActionButton({ icon: Icon, color, title, subtitle }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-900/30 text-blue-400',
        amber: 'bg-amber-900/30 text-amber-400',
        purple: 'bg-purple-900/30 text-purple-400',
    };
    return (
        <button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left border border-transparent hover:border-amber-500/20" suppressHydrationWarning>
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                <Icon size={20} />
            </div>
            <div>
                <p className="font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
        </button>
    );
}
