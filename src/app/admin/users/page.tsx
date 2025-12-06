
'use client';

import { Users, Search, Filter, MoreVertical, Shield, Trash2, Edit } from 'lucide-react';

export default function AdminUsers() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400">Manage access and roles</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                    Add User
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <select className="px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 outline-none">
                        <option>All Roles</option>
                        <option>Teacher</option>
                        <option>Student</option>
                        <option>Admin</option>
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300">
                                            U{i}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">User Name {i}</div>
                                            <div className="text-xs text-gray-500">user{i}@lumina.edu</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${i % 2 === 0 ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'
                                        }`}>
                                        {i % 2 === 0 ? 'Teacher' : 'Student'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-green-400 text-xs flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                        Active
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">Dec 0{i}, 2023</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                                            <Trash2 className="w-4 h-4" />
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
}
