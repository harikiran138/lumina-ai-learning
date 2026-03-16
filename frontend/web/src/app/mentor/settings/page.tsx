"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  MapPin, 
  Globe, 
  Briefcase, 
  Camera,
  Save,
  Clock,
  ChevronRight,
  Zap,
  Lock,
  Moon,
  Info,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function MentorSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'preferences'>('profile');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const u = await api.getCurrentUser();
      setUser(u);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'availability', icon: Clock, label: 'Availability' },
    { id: 'preferences', icon: Bell, label: 'Notifications' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Mentor <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Manage your mentorship profile and availability</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-lumina-primary to-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-lg">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="flex gap-4 p-1 rounded-2xl bg-white/5 border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
              activeTab === tab.id
                ? "bg-lumina-primary text-black shadow-gold-glow"
                : "text-gray-500 hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
           <GlassCard className="p-8 flex flex-col items-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-white/10 group">
                   <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-lumina-primary" />
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-lumina-primary text-black shadow-gold-glow">
                   <Shield className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tighter">{user?.name || "Lumina Mentor"}</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{user?.role || "Mentor"}</p>

              <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Trust Score</span>
                    <span className="text-xs font-bold text-lumina-highlight">9.8/10</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-lumina-primary w-[98%] shadow-gold-glow"></div>
                 </div>
              </div>
           </GlassCard>

           <GlassCard className="p-6 bg-gradient-to-br from-lumina-primary/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-lumina-primary" />
                <h4 className="font-bold text-white text-sm">System Insights</h4>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">
                "Your quick response time on portfolio reviews has improved mentee satisfaction by 18%."
              </p>
           </GlassCard>
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeTab === 'profile' && (
            <GlassCard className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                       <input
                        className="w-full pl-12 pr-4 py-3 rounded-2xl glass-v2 border-white/10 text-white text-sm font-medium focus:outline-none focus:border-lumina-primary/40 transition-all shadow-inner"
                        defaultValue={user?.name}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                       <input
                        className="w-full pl-12 pr-4 py-3 rounded-2xl glass-v2 border-white/10 text-white text-sm font-medium focus:outline-none focus:border-lumina-primary/40 transition-all shadow-inner"
                        defaultValue={user?.email}
                       />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Professional Bio</label>
                  <textarea
                    className="w-full h-32 p-6 rounded-3xl glass-v2 border-white/10 text-white text-sm font-medium focus:outline-none focus:border-lumina-primary/40 transition-all resize-none shadow-inner"
                    placeholder="Describe your expertise and what you look for in mentees..."
                    defaultValue={user?.bio}
                  ></textarea>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500 group-hover:text-lumina-primary transition-colors" />
                        <div>
                           <p className="text-xs font-bold text-white uppercase tracking-tighter">Availability Status</p>
                           <p className="text-[10px] text-gray-500 font-medium">Accepting new mentees</p>
                        </div>
                     </div>
                     <div className="w-10 h-6 bg-lumina-primary/30 rounded-full relative flex items-center px-1">
                        <div className="w-4 h-4 bg-lumina-primary rounded-full absolute right-1"></div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                     <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-lumina-primary transition-colors" />
                        <div>
                           <p className="text-xs font-bold text-white uppercase tracking-tighter">Public Profile</p>
                           <p className="text-[10px] text-gray-500 font-medium">Visible to all students</p>
                        </div>
                     </div>
                     <div className="w-10 h-6 bg-lumina-primary/30 rounded-full relative flex items-center px-1">
                        <div className="w-4 h-4 bg-lumina-primary rounded-full absolute right-1"></div>
                     </div>
                  </div>
               </div>
            </GlassCard>
          )}

          {activeTab === 'availability' && (
            <GlassCard className="p-8 space-y-8">
               <div className="flex items-center gap-3 mb-4">
                 <Clock className="w-6 h-6 text-lumina-primary" />
                 <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Weekly Slots</h3>
               </div>
               <div className="space-y-4">
                  {['Monday', 'Wednesday', 'Friday'].map((day) => (
                    <div key={day} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5">
                       <span className="text-sm font-bold text-white">{day}</span>
                       <div className="flex items-center gap-4">
                          <span className="text-xs font-medium text-gray-500">9:00 AM - 12:00 PM</span>
                          <button className="text-red-400/50 hover:text-red-400 transition-colors">
                             <X className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))}
                  <button className="w-full py-4 rounded-3xl border-2 border-dashed border-white/5 text-gray-500 hover:text-white hover:border-white/10 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Add Slot
                  </button>
               </div>
            </GlassCard>
          )}

          {activeTab === 'preferences' && (
            <GlassCard className="p-8 space-y-4">
               {[
                 { title: 'Session Requests', desc: 'Get notified when a mentee requests a meeting' },
                 { title: 'Review Alerts', desc: 'Alert me when new portfolios are submitted' },
                 { title: 'Weekly Summary', desc: 'Detailed report on mentorship impact' }
               ].map((item) => (
                 <div key={item.title} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
                    <div className="max-w-md">
                       <h4 className="text-sm font-bold text-white uppercase tracking-tighter">{item.title}</h4>
                       <p className="text-xs text-gray-500 font-medium mt-1">{item.desc}</p>
                    </div>
                    <div className="w-12 h-6 bg-white/5 rounded-full relative flex items-center px-1 group cursor-pointer">
                       <div className="w-4 h-4 bg-gray-600 rounded-full group-hover:bg-gray-400 transition-all"></div>
                    </div>
                 </div>
               ))}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
