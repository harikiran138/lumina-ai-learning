'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
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
    const [isEditing, setIsEditing] = useState(false); // Restore isEditing
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editForm, setEditForm] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        avatar: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            const data = await api.getStudentProfile();
            setProfile(data);
            setEditForm({
                name: data?.name || '',
                username: data?.username || '', // Assuming backend returns this now
                email: data?.email || '',
                phone: data?.phone || '',
                avatar: data?.avatar || ''
            });
            setIsLoading(false);
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await api.updateProfile(editForm);
        if (res.success) {
            setProfile({ ...profile, ...editForm });
            setIsEditing(false);
            // Optionally show toast
        } else {
            alert('Failed to update profile');
        }
    };

    if (isLoading) return <div className="text-white text-center p-20">Loading profile...</div>;

    return (
        <div className="space-y-6">
            {/* Header / Cover */}
            <div className="relative h-48 md:h-64 rounded-xl overflow-hidden bg-gradient-to-r from-lumina-primary/20 via-blue-500/20 to-purple-500/20 border border-white/10">
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-lg hover:bg-black/60 transition-colors backdrop-blur-md border border-white/10"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
            </div>

            {/* Profile Info Section */}
            <div className="relative px-4 pb-4 md:px-8 -mt-20">
                <div className="flex flex-col md:flex-row gap-6 items-end md:items-start">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-black bg-gray-800 overflow-hidden relative z-10">
                            <img src={profile?.avatar || "https://ui-avatars.com/api/?name=User&background=random"} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <button className="absolute bottom-2 right-2 z-20 p-2 bg-lumina-primary text-black rounded-full hover:bg-lumina-secondary transition-colors shadow-lg">
                            <Camera className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 text-center md:text-left pt-4 md:pt-20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-1">{profile?.name}</h1>
                                <p className="text-gray-400 text-lg">{profile?.role} • Level {profile?.level || 1}</p>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors font-medium flex items-center gap-2 mx-auto md:mx-0"
                            >
                                <Edit2 className="w-4 h-4" /> Edit Profile
                            </button>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6 text-sm text-gray-400">
                            <div className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" /> San Francisco, CA
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-4 h-4" /> {profile?.email}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" /> Joined {profile?.joinedDate ? new Date(profile.joinedDate).toLocaleDateString() : 'Recently'}
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

            {/* Edit Profile Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            ✕
                        </button>

                        <h2 className="text-xl font-bold text-white mb-2">Edit Profile</h2>
                        <p className="text-sm text-gray-400 mb-6">Update your personal information</p>

                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            {/* Avatar Section */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                                    <img src={editForm.avatar || profile?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-white mb-1">Change Avatar</label>
                                    <p className="text-xs text-gray-500 mb-2">JPG, GIF or PNG. Max 1MB.</p>
                                    <input
                                        type="text"
                                        placeholder="Avatar URL"
                                        value={editForm.avatar}
                                        onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-lumina-primary outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lumina-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        placeholder="@username"
                                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lumina-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        disabled
                                        className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={editForm.phone}
                                        placeholder="+1 (555) 000-0000"
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-lumina-primary outline-none"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-6 py-2 bg-lumina-primary text-black font-semibold rounded-lg hover:bg-lumina-secondary transition-colors"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
