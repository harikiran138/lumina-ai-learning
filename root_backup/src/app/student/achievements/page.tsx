'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Award, Lock, Sparkles } from 'lucide-react';

export default function AchievementsPage() {
    const [badges, setBadges] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            const data = await api.getStudentBadges();
            setBadges(data);
            setIsLoading(false);
        };
        fetchBadges();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lumina-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Award className="w-8 h-8 text-amber-500" />
                        Achievements
                    </h1>
                    <p className="text-gray-400">Track your learning milestones and earned badges.</p>
                </div>
                <div className="glass-card px-6 py-3 bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30">
                    <span className="text-2xl font-bold text-white">{badges.length}</span>
                    <span className="text-sm text-gray-400 ml-2">Total Badges</span>
                </div>
            </div>

            {badges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {badges.map((badge) => (
                        <div key={badge.id} className="glass-card p-6 relative group hover:bg-white/10 transition-all duration-300">
                            <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-black border-2 border-amber-500/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-amber-500/10">
                                    <Award className="w-10 h-10 text-amber-500" />
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2">{badge.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 line-clamp-2">{badge.description}</p>

                                <div className="w-full h-[1px] bg-white/10 mb-4"></div>

                                <div className="flex items-center justify-between w-full text-xs text-gray-500">
                                    <span>Earned</span>
                                    <span>{new Date(badge.dateEarned).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder for locked badges (Visual only) */}
                    {[1, 2, 3].map((i) => (
                        <div key={`locked-${i}`} className="glass-card p-6 relative grayscale opacity-50 border-dashed border-gray-700">
                            <div className="flex flex-col items-center text-center">
                                <div className="w-20 h-20 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center mb-4">
                                    <Lock className="w-8 h-8 text-gray-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-500 mb-2">Locked Badge</h3>
                                <p className="text-sm text-gray-600 mb-4">Keep learning to unlock more achievements!</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 glass-card">
                    <Award className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">No Badges Yet</h2>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Complete course modules and quizzes to start earning badges. Your achievements will appear here.
                    </p>
                </div>
            )}
        </div>
    );
}
