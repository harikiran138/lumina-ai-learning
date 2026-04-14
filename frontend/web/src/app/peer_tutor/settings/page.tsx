"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Settings, 
  Bell, 
  Shield, 
  Clock, 
  Award, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  Camera,
  Globe,
  Lock,
  Moon,
  Save,
  Info,
  Briefcase,
  X,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function PeerTutorSettings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'expertise' | 'notifications'>('profile');
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
    { id: 'expertise', icon: Award, label: 'Expertise' },
    { id: 'notifications', icon: Bell, label: 'Alerts' }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Tutor <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Customize your tutoring presence and preferences</p>
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
                    src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name || 'T'}&background=random`} 
                    alt="Profile" 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                      <Camera className="w-6 h-6 text-white" />
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-lumina-primary text-black shadow-gold-glow">
                   <Shield className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-1 uppercase tracking-tighter">{user?.name || "Peer Tutor"}</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Active Tutor</p>
              
              <div className="w-full mt-8 pt-8 border-t border-white/5 space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Helpfulness</span>
                    <span className="text-xs font-bold text-green-400">98%</span>
                 </div>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-[98%] shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
                 </div>
              </div>
           </GlassCard>

           <GlassCard className="p-6 bg-gradient-to-br from-yellow-500/10 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h4 className="font-bold text-white text-sm">Academy Insight</h4>
              </div>
              <p className="text-[11px] text-gray-400 font-medium leading-relaxed italic">
                "Complete the 'Advanced Calculus' certification to increase your tutoring credits by 25%."
              </p>
           </GlassCard>
        </div>

        <div className="md:col-span-2 space-y-8">
          {activeTab === 'profile' && (
            <GlassCard className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Tutor Alias</label>
                    <input 
                      className="w-full px-5 py-3 rounded-2xl glass-v2 border-white/10 text-white text-sm font-medium focus:outline-none focus:border-lumina-primary/40 transition-all shadow-inner" 
                      defaultValue={user?.name || "Lumina_Tutor_12"}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Academic Level</label>
                    <select className="w-full px-5 py-3 rounded-2xl glass-v2 border-white/10 text-white text-sm font-medium focus:outline-none focus:border-lumina-primary/40 transition-all shadow-inner appearance-none">
                       <option>Undergraduate - Year 3</option>
                       <option>Undergraduate - Year 2</option>
                       <option>Postgraduate</option>
                    </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-1">Tutoring Style & Philosophy</label>
                  <textarea 
                    className="w-full h-32 p-6 rounded-3xl glass-v2 border-white/10 text-white text-sm font-medium focus:outline-none focus:border-lumina-primary/40 transition-all resize-none shadow-inner"
                    placeholder="Tell peers how you help them learn best..."
                    defaultValue="I focus on Socratic questioning to help students arrive at answers themselves."
                  ></textarea>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                     <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-500 group-hover:text-lumina-primary transition-colors" />
                        <div>
                           <p className="text-xs font-bold text-white uppercase tracking-tighter">Live Visibility</p>
                           <p className="text-[10px] text-gray-500 font-medium">Appear in student queues</p>
                        </div>
                     </div>
                     <div className="w-10 h-6 bg-lumina-primary/30 rounded-full relative flex items-center px-1">
                        <div className="w-4 h-4 bg-lumina-primary rounded-full absolute right-1 shadow-md"></div>
                     </div>
                  </div>
                  <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group">
                     <div className="flex items-center gap-3">
                        <Briefcase className="w-5 h-5 text-gray-500 group-hover:text-lumina-primary transition-colors" />
                        <div>
                           <p className="text-xs font-bold text-white uppercase tracking-tighter">Instant Tutoring</p>
                           <p className="text-[10px] text-gray-500 font-medium">Auto-accept session requests</p>
                        </div>
                     </div>
                     <div className="w-10 h-6 bg-white/10 rounded-full relative flex items-center px-1">
                        <div className="w-4 h-4 bg-gray-600 rounded-full absolute left-1"></div>
                     </div>
                  </div>
               </div>
            </GlassCard>
          )}

          {activeTab === 'expertise' && (
            <GlassCard className="p-8 space-y-8">
               <div className="flex items-center gap-3 mb-4">
                 <Award className="w-6 h-6 text-lumina-primary" />
                 <h3 className="text-xl font-bold text-white uppercase tracking-tighter">Certified Subjects</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { subject: 'Linear Algebra', score: 'A+' },
                    { subject: 'Discrete Mathematics', score: 'A' },
                    { subject: 'Introduction to AI', score: 'A+' },
                    { subject: 'Academic Writing', score: 'Verified' }
                  ].map((sub) => (
                    <div key={sub.subject} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-yellow-500/20 transition-all">
                       <span className="text-sm font-bold text-white">{sub.subject}</span>
                       <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-lg uppercase">{sub.score}</span>
                    </div>
                  ))}
                  <button className="col-span-full py-4 rounded-3xl border-2 border-dashed border-white/5 text-gray-500 hover:text-white hover:border-white/10 transition-all font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Request New Certification
                  </button>
               </div>
            </GlassCard>
          )}

          {activeTab === 'notifications' && (
            <GlassCard className="p-8 space-y-4">
               {[
                 { title: 'New Peer Link', desc: 'When a student adds you to their favorites' },
                 { title: 'Certification Alerts', desc: 'When new training modules are available' },
                 { title: 'Ranking Updates', desc: 'Detailed report on your monthly tutoring rank' }
               ].map((item) => (
                 <div key={item.title} className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all">
                    <div className="max-w-md">
                       <h4 className="text-sm font-bold text-white uppercase tracking-tighter">{item.title}</h4>
                       <p className="text-xs text-gray-500 font-medium mt-1">{item.desc}</p>
                    </div>
                    <div className="w-12 h-6 bg-lumina-primary/20 rounded-full relative flex items-center px-1 group cursor-pointer border border-lumina-primary/10">
                       <div className="w-4 h-4 bg-lumina-primary rounded-full absolute right-1 shadow-md transition-all"></div>
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
