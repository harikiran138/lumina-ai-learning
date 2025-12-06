
'use client';

import { Users, Search, Filter, Mail, MoreVertical } from 'lucide-react';

export default function TeacherStudents() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
                    <p className="text-gray-400">View and manage your student roster</p>
                </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                        <Filter className="w-4 h-4" />
                        Filter
                    </button>
                    <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-2 transition-colors">
                        <Mail className="w-4 h-4" />
                        Message All
                    </button>
                </div>
            </div>

            {/* Students List */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Last Active</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {[1, 2, 3, 4, 5].map((student) => (
                                <tr key={student} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                                                S{student}
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">Student User {student}</div>
                                                <div className="text-xs text-gray-500">student{student}@example.com</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">Advanced AI</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 bg-gray-800 rounded-full h-2">
                                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${60 + student * 5}%` }}></div>
                                            </div>
                                            <span className="text-sm text-gray-400">{60 + student * 5}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400">2 hours ago</td>
                                    <td className="px-6 py-4">
                                        <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
