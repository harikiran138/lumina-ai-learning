'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Certificate from '@/components/student/Certificate';
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
    Linkedin,
    Sparkles,
    Bot,
    Brain // Added Brain icon
} from 'lucide-react';

export default function StudentProfile() {
    const [isEditing, setIsEditing] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editForm, setEditForm] = useState({
        name: '',
        username: '',
        email: '',
        phone: '',
        avatar: ''
    });

    const [certificates, setCertificates] = useState<any[]>([]);
    const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
    const [badges, setBadges] = useState<any[]>([]);
    const [mastery, setMastery] = useState<any>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, certificatesData, badgesData, masteryData] = await Promise.all([
                    api.getStudentProfile(),
                    api.getStudentCertificates(),
                    api.getStudentBadges(),
                    api.getStudentMastery()
                ]);

                setProfile(profileData);
                setCertificates(certificatesData);
                setBadges(badgesData);
                setMastery(masteryData);

                if (profileData) {
                    setEditForm({
                        name: profileData.name || '',
                        username: profileData.username || '',
                        email: profileData.email || '',
                        phone: profileData.phone || '',
                        avatar: profileData.avatar || ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch profile data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.updateProfile(editForm);
            setProfile({ ...profile, ...editForm });
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile", error);
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-white">Loading profile...</div>;
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Info */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 text-center relative group backdrop-blur-md bg-black/40 border-white/10">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Edit2 className="w-4 h-4 text-gray-400" />
                            </button>

                            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-lumina-primary to-purple-600 p-[2px] mb-4">
                                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
                                    <img
                                        src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.name}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-white mb-1">{profile?.name}</h2>
                            <p className="text-sm text-lumina-primary mb-4">{profile?.username || '@student'}</p>

                            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                                {profile?.bio || 'Passionate learner exploring the world of AI.'}
                            </p>

                            <div className="space-y-3 text-left">
                                <div className="flex items-center text-sm text-gray-400">
                                    <Mail className="w-4 h-4 mr-3 text-gray-500" />
                                    {profile?.email}
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <MapPin className="w-4 h-4 mr-3 text-gray-500" />
                                    {profile?.location || 'San Francisco, CA'}
                                </div>
                                <div className="flex items-center text-sm text-gray-400">
                                    <Calendar className="w-4 h-4 mr-3 text-gray-500" />
                                    Joined {new Date(profile?.joinedDate || Date.now()).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 backdrop-blur-md bg-black/40 border-white/10">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile?.skills?.map((skill: string, index: number) => (
                                    <span key={index} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300">
                                        {skill}
                                    </span>
                                )) || <span className="text-gray-500 text-sm">No skills listed</span>}
                            </div>
                        </div>

                        {/* AI Tutor Card */}
                        <div className="glass-card p-6 relative overflow-hidden group backdrop-blur-md bg-black/40 border-white/10">
                            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 relative z-10 flex items-center">
                                <Bot className="w-4 h-4 mr-2 text-lumina-primary" />
                                AI Tutor
                            </h3>
                            <p className="text-xs text-gray-400 mb-4 relative z-10">Get personalized learning assistance.</p>
                            <a
                                href="/student/ai_tutor"
                                className="flex items-center justify-center w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all relative z-10 shadow-lg shadow-purple-900/20"
                            >
                                <Sparkles className="w-4 h-4 mr-2" />
                                Open AI Tutor
                            </a>
                        </div>

                        {/* Adaptive Mastery Card */}
                        <div className="glass-card p-6 relative overflow-hidden group backdrop-blur-md bg-black/40 border-white/10 mt-6">
                            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center">
                                <Brain className="w-4 h-4 mr-2 text-pink-500" />
                                Knowledge Mastery
                            </h3>

                            {Object.keys(mastery).length > 0 ? (
                                <div className="space-y-4">
                                    {Object.entries(mastery).map(([concept, score]: [string, any]) => (
                                        <div key={concept}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-300 capitalize">{concept}</span>
                                                <span className="text-pink-400 font-mono">{(score * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-1000"
                                                    style={{ width: `${score * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-gray-500">No assessment data yet.</p>
                            )}
                            <p className="text-xs text-gray-400 mt-4">
                                Based on BKT Analysis
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Activity & Certificates & Badges */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Badges Section */}
                        <div className="glass-card p-6 backdrop-blur-md bg-black/40 border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Earned Badges</h3>
                                <span className="text-sm text-gray-400">{badges.length} Unlocked</span>
                            </div>

                            {badges.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {badges.map((badge) => {
                                        // Dynamic icon selection
                                        const IconComponent = badge.icon === 'Sparkles' ? Sparkles : Award;

                                        return (
                                            <div key={badge.id} className="flex flex-col items-center p-3 rounded-xl bg-white/5 border border-white/10 hover:border-lumina-primary/50 transition-colors group">
                                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm text-white font-medium text-center line-clamp-1">{badge.name}</p>
                                                <p className="text-xs text-gray-400 text-center mt-1">{new Date(badge.dateEarned).toLocaleDateString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6 border border-white/5 rounded-xl bg-white/5">
                                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2 text-gray-600">
                                        <Award className="w-6 h-6" />
                                    </div>
                                    <p className="text-gray-400 text-sm">No badges yet.</p>
                                    <p className="text-xs text-gray-500">Complete modules to earn them!</p>
                                </div>
                            )}
                        </div>

                        <div className="glass-card p-6 backdrop-blur-md bg-black/40 border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-white">Certificates</h3>
                                <span className="text-sm text-gray-400">{certificates.length} Earned</span>
                            </div>

                            {certificates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {certificates.map((cert) => (
                                        <div
                                            key={cert.id}
                                            onClick={() => setSelectedCertificate(cert)}
                                            className="group border border-white/10 rounded-xl p-4 hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                                                    <Award className="w-6 h-6" />
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-medium mb-1 group-hover:text-lumina-primary transition-colors line-clamp-1">
                                                {cert.courseName}
                                            </h4>
                                            <p className="text-xs text-gray-400">ID: {cert.certificateId}</p>

                                            <div className="absolute inset-0 border-2 border-transparent group-hover:border-lumina-primary/20 rounded-xl transition-all"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 border border-white/5 rounded-xl bg-white/5">
                                    <Award className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-400">No certificates earned yet.</p>
                                    <p className="text-xs text-gray-500 mt-1">Complete courses to earn certificates!</p>
                                </div>
                            )}
                        </div>

                        {/* Certificate Modal */}
                        {selectedCertificate && (
                            <Certificate
                                studentName={profile?.name || 'Student'}
                                courseName={selectedCertificate.courseName}
                                issueDate={selectedCertificate.issueDate}
                                certificateId={selectedCertificate.certificateId}
                                onClose={() => setSelectedCertificate(null)}
                            />
                        )}

                        <h3 className="text-lg font-bold text-white mb-6 pl-2 border-l-4 border-lumina-primary">Recent Activity</h3>

                        {profile?.recentActivity && profile.recentActivity.length > 0 ? (
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-600 before:to-transparent">
                                {profile.recentActivity.map((activity: any, idx: number) => (
                                    <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/20 bg-black/80 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-gray-400 backdrop-blur-sm">
                                            {activity.type === 'quiz' ? <Award className="w-5 h-5 text-amber-500" /> : <BookOpen className="w-5 h-5 text-blue-500" />}
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md shadow-sm">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-white text-sm">{activity.title}</div>
                                                <time className="font-caveat font-medium text-amber-500 text-xs">
                                                    {new Date(activity.timestamp).toLocaleDateString()}
                                                </time>
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                                {activity.description}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-gray-500">
                                No recent activity found. Start learning to see updates here!
                            </div>
                        )}
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
        </div>
    );
}
