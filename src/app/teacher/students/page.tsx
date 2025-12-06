
'use client';

import { Users, Search, Filter, Mail, MoreVertical } from 'lucide-react';


import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function TeacherStudents() {
    const [students, setStudents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            const data = await api.getTeacherStudents();
            setStudents(data || []);
            setIsLoading(false);
        };
        fetchStudents();
    }, []);

    if (isLoading) return <div className="text-white text-center p-10">Loading students...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
                    <p className="text-gray-400">View and manage your student roster</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-lumina-primary outline-none"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg flex items-center gap-2 transition-colors border border-white/10">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-lumina-primary text-black font-medium hover:bg-lumina-secondary rounded-lg flex items-center gap-2 transition-colors">
                        <Mail className="w-4 h-4" />
                        Message All
                    </button>
                </div>
            </div>

            {/* Students List */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Courses</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Last Active</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-lumina-primary/20 text-lumina-primary flex items-center justify-center font-bold overflow-hidden border border-lumina-primary/30">
                                                    {student.avatar ? (
                                                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        student.name.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{student.name}</div>
                                                    <div className="text-xs text-gray-500">{student.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {student.courses.join(', ') || 'No active courses'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-white/10 rounded-full h-1.5">
                                                    <div className="bg-lumina-primary h-1.5 rounded-full" style={{ width: `${student.progress}%` }}></div>
                                                </div>
                                                <span className="text-xs text-gray-400">{student.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400">
                                            {new Date(student.lastActive).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No students found in your courses.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
