
'use client';

import { User, Bell, Lock, Shield, Save } from 'lucide-react';

export default function TeacherSettings() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-white mb-8">Account Settings</h1>

            <div className="grid gap-8">
                {/* Profile Section */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <User className="w-6 h-6 text-amber-500" />
                        <h2 className="text-xl font-semibold text-white">Profile Information</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Full Name</label>
                            <input type="text" defaultValue="Teacher User" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Email Address</label>
                            <input type="email" defaultValue="teacher@lumina.edu" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm text-gray-400">Bio</label>
                            <textarea className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white outline-none focus:border-amber-500 h-24" placeholder="Tell us about yourself..."></textarea>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Bell className="w-6 h-6 text-amber-500" />
                        <h2 className="text-xl font-semibold text-white">Notifications</h2>
                    </div>
                    <div className="space-y-4">
                        {['New student enrollment', 'Assignment submissions', 'System updates'].map((item) => (
                            <div key={item} className="flex items-center justify-between">
                                <span className="text-gray-300">{item}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end">
                    <button className="flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors">
                        <Save className="w-5 h-5 mr-2" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
