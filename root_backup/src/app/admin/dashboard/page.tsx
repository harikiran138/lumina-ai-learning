
import { Metadata } from 'next';
import { Users, BookOpen, Database, Shield, Activity, Server, AlertTriangle, CheckCircle, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Admin Dashboard | Lumina',
    description: 'System administration and overview',
};

async function getAdminStats() {
    try {
        // Use Server Action
        const { getAdminDashboard } = await import('@/app/actions/data');
        const stats = await getAdminDashboard('admin@lumina.com'); // Could pass dynamic email if available

        return stats || {
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalCourses: 0,
            systemHealth: '0%',
            securityAlerts: 0
        };
    } catch (e) {
        console.error("Failed to fetch admin stats", e);
        return {
            totalUsers: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalCourses: 0,
            systemHealth: '0%',
            securityAlerts: 0
        };
    }
}

export default async function AdminDashboard() {
    const stats = await getAdminStats();

    return (
        <div className="space-y-8">
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
                    System <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">Overview</span>
                </h1>
                <p className="text-gray-400">Monitor system performance and user activity.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                <StatCard
                    icon={Users}
                    color="blue"
                    label="Total Students"
                    value={stats.totalStudents || 0}
                    subtext="Enrolled learners"
                    trend="+12% growth"
                />
                <StatCard
                    icon={GraduationCap}
                    color="green"
                    label="Total Teachers"
                    value={stats.totalTeachers || 0}
                    subtext="Active instructors"
                />
                <StatCard
                    icon={BookOpen}
                    color="amber"
                    label="Total Courses"
                    value={stats.totalCourses}
                    subtext="Active curricula"
                />
                <StatCard
                    icon={Shield}
                    color="purple"
                    label="Total Users"
                    value={stats.totalUsers}
                    subtext="All accounts"
                    trend="Secure"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
                {/* System Status */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Server className="w-5 h-5 text-gray-400" />
                        System Status
                    </h2>
                    <div className="space-y-4">
                        <StatusItem name="Database Cluster" status="Operational" />
                        <StatusItem name="API Gateway" status="Operational" />
                        <StatusItem name="Content Delivery" status="Operational" />
                        <StatusItem name="Authentication" status="Operational" />
                        <StatusItem name="Backup Systems" status="Idle" />
                    </div>
                </div>

                {/* Recent Activity Logs */}
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-400" />
                        Recent Logs
                    </h2>
                    <div className="space-y-4">
                        {/* Mock Logs */}
                        <LogItem time="10:42 AM" action="User Login" detail="teacher@lumina.edu" status="success" />
                        <LogItem time="10:38 AM" action="Course Created" detail="Intro to ML" status="success" />
                        <LogItem time="10:15 AM" action="Backup Config" detail="System Snapshot" status="info" />
                        <LogItem time="09:55 AM" action="Failed Login" detail="IP: 192.168.1.1" status="warning" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helpers

function StatCard({ icon: Icon, color, label, value, subtext, trend }: any) {
    const colorClasses: any = {
        blue: 'bg-blue-900/30 text-blue-400',
        amber: 'bg-amber-900/30 text-amber-400',
        green: 'bg-green-900/30 text-green-400',
        purple: 'bg-purple-900/30 text-purple-400',
    };

    return (
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className="text-xs font-semibold text-gray-400">{trend}</span>
                )}
            </div>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            <p className="text-sm text-gray-400 mt-2">{subtext}</p>
        </div>
    );
}

function StatusItem({ name, status }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-transparent hover:border-gray-700">
            <span className="text-white font-medium">{name}</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${status === 'Operational' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className={`text-sm ${status === 'Operational' ? 'text-green-400' : 'text-yellow-400'}`}>{status}</span>
            </div>
        </div>
    );
}

function LogItem({ time, action, detail, status }: any) {
    const statusColors: any = {
        success: 'text-green-400',
        warning: 'text-red-400',
        info: 'text-blue-400'
    };

    return (
        <div className="flex items-center justify-between text-sm py-2 border-b border-gray-800 last:border-0">
            <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono text-xs">{time}</span>
                <span className="text-white font-medium">{action}</span>
            </div>
            <span className={`text-xs ${statusColors[status]}`}>{detail}</span>
        </div>
    );
}
