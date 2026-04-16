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
      'rounded-3xl border border-border bg-surface-elevated shadow-premium overflow-hidden',
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
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Mentor <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-text-muted mt-1 font-medium italic">Manage your mentorship profile and availability</p>
        </div>
        <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="flex gap-4 p-1 rounded-2xl bg-surface border border-border w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-text-muted hover:text-foreground"
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
               <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-border group">
                   <img
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                    alt="Profile"
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                   />
                 <div className="absolute inset-0 bg-foreground/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                   <Camera className="w-6 h-6 text-primary" />
                   </div>
                </div>
               <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
                   <Shield className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-1 uppercase tracking-tighter">{user?.name || "Lumina Mentor"}</h3>
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest">{user?.role || "Mentor"}</p>

              <div className="w-full mt-8 pt-8 border-t border-border space-y-4">
                 <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Trust Score</span>
                  <span className="text-xs font-bold text-primary">9.8/10</span>
                 </div>
                <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[98%] shadow-lg"></div>
                 </div>
              </div>
           </GlassCard>

            <GlassCard className="p-6 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
               <Zap className="w-5 h-5 text-primary" />
               <h4 className="font-bold text-foreground text-sm">System Insights</h4>
              </div>
              <p className="text-[11px] text-text-muted font-medium leading-relaxed italic">
                "Your quick response time on portfolio reviews has improved mentee satisfaction by 18%."
              </p>
           </GlassCard>
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeTab === 'profile' && (
            <GlassCard className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Full Name</label>
                    <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                       <input
                    className="w-full pl-12 pr-4 py-3 rounded-2xl glass-v2 border-border text-foreground text-sm font-medium focus:outline-none focus:border-primary transition-all shadow-inner"
                        defaultValue={user?.name}
                       />
                    </div>
                  </div>
                  <div className="space-y-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                       <input
                    className="w-full pl-12 pr-4 py-3 rounded-2xl glass-v2 border-border text-foreground text-sm font-medium focus:outline-none focus:border-primary transition-all shadow-inner"
                        defaultValue={user?.email}
                       />
                    </div>
                  </div>
               </div>

               <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Professional Bio</label>
                  <textarea
                  className="w-full h-32 p-6 rounded-3xl glass-v2 border-border text-foreground text-sm font-medium focus:outline-none focus:border-primary transition-all resize-none shadow-inner"
                    placeholder="Describe your expertise and what you look for in mentees..."
                    defaultValue={user?.bio}
                  ></textarea>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="flex items-center justify-between p-5 rounded-3xl bg-surface border border-border hover:bg-surface-elevated transition-all group">
                     <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                        <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-tighter">Availability Status</p>
                      <p className="text-[10px] text-text-muted font-medium">Accepting new mentees</p>
                        </div>
                     </div>
                  <div className="w-10 h-6 bg-primary/30 rounded-full relative flex items-center px-1">
                    <div className="w-4 h-4 bg-primary rounded-full absolute right-1"></div>
                     </div>
                  </div>
                <div className="flex items-center justify-between p-5 rounded-3xl bg-surface border border-border hover:bg-surface-elevated transition-all group">
                     <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                        <div>
                      <p className="text-xs font-bold text-foreground uppercase tracking-tighter">Public Profile</p>
                      <p className="text-[10px] text-text-muted font-medium">Visible to all students</p>
                        </div>
                     </div>
                  <div className="w-10 h-6 bg-primary/30 rounded-full relative flex items-center px-1">
                    <div className="w-4 h-4 bg-primary rounded-full absolute right-1"></div>
                     </div>
                  </div>
               </div>
            </GlassCard>
          )}

          {activeTab === 'availability' && (
            <GlassCard className="p-8 space-y-8">
               <div className="flex items-center gap-3 mb-4">
                <Clock className="w-6 h-6 text-primary" />
                <h3 className="text-xl font-bold text-foreground uppercase tracking-tighter">Weekly Slots</h3>
               </div>
               <div className="space-y-4">
                  {['Monday', 'Wednesday', 'Friday'].map((day) => (
                  <div key={day} className="flex items-center justify-between p-5 rounded-3xl bg-surface border border-border">
                    <span className="text-sm font-bold text-foreground">{day}</span>
                       <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-text-muted">9:00 AM - 12:00 PM</span>
                      <button className="text-danger/70 hover:text-danger transition-colors">
                             <X className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  ))}
                <button className="w-full py-4 rounded-3xl border-2 border-dashed border-border text-text-muted hover:text-foreground hover:border-primary/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
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
                <div key={item.title} className="flex items-center justify-between p-6 rounded-3xl bg-surface border border-border hover:bg-surface-elevated transition-all">
                    <div className="max-w-md">
                    <h4 className="text-sm font-bold text-foreground uppercase tracking-tighter">{item.title}</h4>
                    <p className="text-xs text-text-muted font-medium mt-1">{item.desc}</p>
                    </div>
                  <div className="w-12 h-6 bg-surface-elevated rounded-full relative flex items-center px-1 group cursor-pointer border border-border">
                    <div className="w-4 h-4 bg-text-muted rounded-full group-hover:bg-text-secondary transition-all"></div>
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
