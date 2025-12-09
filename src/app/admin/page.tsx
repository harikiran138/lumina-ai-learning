'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
    Users,
    BookOpen,
    MessageSquare,
    Activity,
    Search,
    Filter,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Shield,
    Bot,
    Clock,
    User,
    GraduationCap,
    TrendingUp,
    Trash2
} from 'lucide-react';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses' | 'ai-logs' | 'community' | 'student-progress'>('overview');
    const [loading, setLoading] = useState(true);

    // Data State
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [aiLogs, setAiLogs] = useState<any[]>([]);
    const [studentProgress, setStudentProgress] = useState<any[]>([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'overview') {
                const dashboard = await api.getDashboardData('admin');
                setStats(dashboard);
            } else if (activeTab === 'users') {
                const data = await api.getAllUsers();
                setUsers(data);
            } else if (activeTab === 'courses') {
                const data = await api.getAllCoursesAdmin();
                setCourses(data);
            } else if (activeTab === 'ai-logs') {
                const data = await api.getAllAILogs();
                setAiLogs(data);
            } else if (activeTab === 'student-progress') {
                const data = await api.getAllStudentsWithProgress();
                setStudentProgress(data);
            }
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId: string, status: string) => {
        await api.updateUserStatus(userId, status);
        loadData(); // Refresh
    };

    const handleRoleUpdate = async (userId: string, role: string) => {
        await api.updateUserRole(userId, role);
        loadData(); // Refresh
    };

    const handleDeleteUser = async (userId: string) => {
        if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            console.log('Deleting user:', userId);
            const result = await api.deleteUser(userId);
            if (result.success) {
                // alert('User deleted successfully');
                loadData();
            } else {
                alert('Failed to delete user: ' + (result.error || 'Unknown error'));
            }
        }
    };

    const handleDeleteLog = async (logId: string) => {
        if (!confirm('Delete this log entry?')) return;
        console.log('Deleting log:', logId);
        const result = await api.deleteAILog(logId);
        if (result.success) {
            loadData();
        } else {
            alert('Failed to delete log: ' + (result.error || 'Unknown error'));
        }
    };

    const renderOverview = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400">Total Students</h3>
                    <Users className="text-lumina-primary" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalStudents || 0}</p>
            </div>
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400">Total Teachers</h3>
                    <GraduationCap className="text-green-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalTeachers || 0}</p>
            </div>
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400">Total Courses</h3>
                    <BookOpen className="text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalCourses || 0}</p>
            </div>
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-400">System Health</h3>
                    <Activity className="text-green-500" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.systemHealth || '100%'}</p>
            </div>
        </div>
    );


    const renderStudentProgress = () => (
        <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lumina-primary" />
                    Student Progress Overview
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Student</th>
                            <th className="px-6 py-3">Enrolled Courses</th>
                            <th className="px-6 py-3">Avg. Progress</th>
                            <th className="px-6 py-3">Last Active</th>
                            <th className="px-6 py-3">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {studentProgress.map((student: any) => (
                            <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                            {student.avatar || student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{student.name}</div>
                                            <div className="text-gray-500 text-xs">{student.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-white font-medium">{student.coursesEnrolled}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-lumina-primary"
                                                style={{ width: `${student.avgProgress}%` }}
                                            />
                                        </div>
                                        <span className="text-gray-400 text-xs">{student.avgProgress}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(student.lastActive).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <button className="text-lumina-primary hover:underline text-xs">View Report</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderUsersTable = () => (
        <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-lumina-primary"
                    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user: any) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold">
                                            {user.avatar || user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">{user.name}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                                        user.role === 'teacher' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.status === 'active' ? 'bg-green-500/20 text-green-400' :
                                        'bg-red-500/20 text-red-400'
                                        }`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {user.role !== 'admin' && (
                                            <>
                                                <button
                                                    onClick={() => handleRoleUpdate(user.id, 'admin')}
                                                    className="p-1.5 hover:bg-white/10 rounded text-purple-400"
                                                    title="Make Admin"
                                                >
                                                    <Shield className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-1.5 hover:bg-white/10 rounded text-red-500"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={() => handleStatusUpdate(user.id, user.status === 'active' ? 'suspended' : 'active')}
                                            className={`p-1.5 hover:bg-white/10 rounded ${user.status === 'active' ? 'text-orange-400' : 'text-green-400'}`}
                                            title={user.status === 'active' ? 'Suspend' : 'Activate'}
                                        >
                                            {user.status === 'active' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderAILogs = () => (
        <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold">AI Conversational Audit</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Timestamp</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Prompt</th>
                            <th className="px-6 py-3">AI Response</th>
                            <th className="px-6 py-3">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {aiLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No logs found.</td>
                            </tr>
                        ) : aiLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-gray-400 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-lumina-primary" />
                                        <span className="text-white">{log.userName}</span>
                                        <span className="text-xs text-gray-500">({log.userRole})</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300 max-w-xs truncate" title={log.prompt}>
                                    {log.prompt}
                                </td>
                                <td className="px-6 py-4 text-gray-400 max-w-xs truncate" title={log.response}>
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-3 h-3 text-purple-400" />
                                        {log.response}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="text-red-500 hover:text-red-400 p-1"
                                        title="Delete Log"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderCoursesTable = () => (
        <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-semibold">All Courses</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-3">Course Name</th>
                            <th className="px-6 py-3">Instructor</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Enrolled</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {courses.map((course: any) => (
                            <tr key={course.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 text-white font-medium">{course.name}</td>
                                <td className="px-6 py-4 text-gray-400">{course.instructorName}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${course.status === 'published' ? 'bg-green-500/20 text-green-400' :
                                        'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {course.status || 'draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-300">{course.enrolledCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                Admin Dashboard
            </h1>

            {/* Navigation Tabs */}
            <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
                {['overview', 'users', 'student-progress', 'courses', 'ai-logs', 'community'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                            ? 'bg-lumina-primary text-black'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            } capitalize`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading data...</div>
            ) : (
                <>
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'users' && renderUsersTable()}
                    {activeTab === 'student-progress' && renderStudentProgress()}
                    {activeTab === 'courses' && renderCoursesTable()}
                    {activeTab === 'ai-logs' && renderAILogs()}
                    {activeTab === 'community' && <div className="text-gray-500 text-center py-20">Community Moderation Coming Soon</div>}
                </>
            )}
        </div>
    );
}
