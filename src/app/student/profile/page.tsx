'use client';

import { useState } from 'react';
import {
    User,
    Mail,
    MapPin,
    Calendar,
    Edit2,
    Award,
    BookOpen,
    Camera,
    Link as LinkIcon,
    Github,
    Twitter,
    Linkedin
} from 'lucide-react';

export default function StudentProfile() {
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div className="space-y-6">
            {/* Header / Cover */}
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-lumina-primary/20 via-blue-500/20 to-purple-500/20 border border-white/10">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                <button className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10">
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>

            {/* Profile Info Section */}
            <div className="relative px-4 pb-4 md:px-8 -mt-20">
                <div className="flex flex-col md:flex-row gap-6 items-end md:items-start">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black bg-gray-800 overflow-hidden relative z-10">
                            <img src="https://ui-avatars.com/api/?name=Student+User&background=0D8ABC&color=fff&size=256" alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-2 right-2 z-20 p-2 bg-lumina-primary text-black rounded-full hover:bg-lumina-secondary transition-colors shadow-lg">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 text-center md:text-left pt-4 md:pt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">Student User</h1>
                                <p className="text-gray-400 text-lg">Computer Science Major • Level 5 Learner</p>
                            </div>
                            <button className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors font-medium flex items-center gap-2 mx-auto md:mx-0">
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" /> San Francisco, CA
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" /> student@lumina.com
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" /> Joined September 2024
                            </div>
                            <div className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                                <LinkIcon className="w-4 h-4" /> lumina.learning/student
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Stats & Bio */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">About Me</h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                            Passionate about AI and Machine Learning. Currently focusing on Deep Learning fundamentals and Neural Networks. Always eager to learn new technologies and collaborate on projects.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Github className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-white/10 transition-colors">
                                <Twitter className="w-5 h-5" />
                            </button>
                            <button className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-white/10 transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {['React', 'TypeScript', 'Python', 'Machine Learning', 'Data Science', 'UI Design'].map(skill => (
                                <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - Activity & Certificates */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-white">Certificates</h3>
                            <button className="text-sm text-lumina-primary hover:underline">View All</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[1, 2].map((cert, i) => (
                                <div key={i} className="group border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                                            <Award className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs text-gray-500">Issued Oct 2024</span>
                                    </div>
                                    <h4 className="text-white font-medium mb-1 group-hover:text-lumina-primary transition-colors">Machine Learning Basics</h4>
                                    <p className="text-xs text-gray-400">Lumina AI Learning Platform</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
                        <div className="space-y-6">
                            {[
                                { icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-400/20', title: 'Completed Lesson: Neural Networks I', time: '2 hours ago' },
                                { icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/20', title: 'Earned Badge: Quick Learner', time: '1 day ago' },
                                { icon: Edit2, color: 'text-green-400', bg: 'bg-green-400/20', title: 'Posted in Community: Help with Python', time: '2 days ago' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{item.title}</p>
                                        <p className="text-xs text-gray-500 mt-1">{item.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
