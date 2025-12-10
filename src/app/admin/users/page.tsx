
'use client';

import { useState, useEffect } from 'react';
import { Users, Search, Filter, MoreVertical, Shield, Trash2, Edit, X } from 'lucide-react';
import { getUsersForAdmin } from '@/app/actions/data';
import { api } from '@/lib/api';

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });

    const fetchUsers = async () => {
        setIsLoading(true);
        const data = await getUsersForAdmin();
        setUsers(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role as any
            });
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', role: 'student' });
            fetchUsers(); // Refresh list
            alert('User created successfully');
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-white">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
                    <p className="text-gray-400">Manage access and roles</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
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
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center font-bold text-gray-300 overflow-hidden">
                                            {user.avatar ? <img src={user.avatar} alt={user.name} /> : 'U'}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'teacher' ? 'bg-amber-900/30 text-amber-400' :
                                        user.role === 'admin' ? 'bg-red-900/30 text-red-400' :
                                            'bg-blue-900/30 text-blue-400'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-green-400 text-xs flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-400">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
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

            {/* Add User Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 p-6 rounded-2xl w-full max-w-md relative shadow-2xl">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-6">Add New User</h2>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="john@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    {/* Admin creation intentionally omitted */}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors mt-4"
                            >
                                Create User
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
