"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  User,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn('rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden', className)}
  >
    {children}
  </motion.div>
);

type TabKey = 'profile' | 'notifications' | 'privacy' | 'security';

const tabs: { key: TabKey; label: string; icon: React.FC<any> }[] = [
  { key: 'profile',       label: 'Profile',        icon: User },
  { key: 'notifications', label: 'Notifications',  icon: Bell },
  { key: 'privacy',       label: 'Privacy',        icon: Shield },
  { key: 'security',      label: 'Security',       icon: Lock },
];

export default function CounselorSettings() {
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [showPass, setShowPass]   = useState(false);
  const [saved, setSaved]         = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Counselor <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-gray-400 mt-1 font-medium italic">Manage your profile, notifications, privacy, and security preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tab list */}
        <div className="space-y-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold transition-all text-left',
                activeTab === key
                  ? 'bg-lumina-highlight/10 text-lumina-highlight border border-lumina-highlight/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="lg:col-span-3">
          <GlassCard className="p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Profile Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { label: 'Full Name',        placeholder: 'Dr. Sarah Smith',            type: 'text' },
                    { label: 'Email',             placeholder: 'sarah.smith@lumina.edu',     type: 'email' },
                    { label: 'Department',        placeholder: 'Student Services',           type: 'text' },
                    { label: 'Employee ID',       placeholder: 'EMP-2024-0045',              type: 'text' },
                  ].map((field) => (
                    <div key={field.label} className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-lumina-highlight/40 transition-all"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bio</label>
                  <textarea
                    placeholder="Brief professional bio…"
                    className="w-full h-24 px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-lumina-highlight/40 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Notification Preferences</h2>
                {[
                  { label: 'High-risk alerts',          desc: 'Notify immediately when a student reaches high-risk threshold.',   default: true },
                  { label: 'Intervention reminders',    desc: 'Remind me before scheduled sessions and follow-ups.',              default: true },
                  { label: 'Referral status updates',   desc: 'Notify when referrals are accepted or completed.',                 default: true },
                  { label: 'Weekly risk summary',       desc: 'Receive weekly cohort wellness digest every Monday.',              default: false },
                  { label: 'System announcements',      desc: 'Platform updates, maintenance windows, and policy changes.',       default: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div>
                      <p className="font-bold text-white text-sm">{item.label}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lumina-highlight" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Privacy Controls</h2>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-400/80 font-medium leading-relaxed">
                      Counselor notes are end-to-end encrypted by default. Modifying privacy settings will be logged as a safeguarding event.
                    </p>
                  </div>
                </div>
                {[
                  { label: 'Zero-knowledge note encryption',   desc: 'Session notes encrypted with your session key only.',          locked: true, enabled: true },
                  { label: 'Identity masking by default',      desc: 'Student identities shown as anonymous in all views by default.', locked: false, enabled: true },
                  { label: 'Audit log for identity reveals',   desc: 'All identity reveal actions are immutably logged.',             locked: true, enabled: true },
                  { label: 'Share data with faculty',          desc: 'Allow faculty to see aggregated (non-sensitive) risk flags.',   locked: false, enabled: false },
                ].map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-start gap-3">
                      {item.locked && <Lock className="w-3.5 h-3.5 text-lumina-highlight mt-0.5 shrink-0" />}
                      <div>
                        <p className="font-bold text-white text-sm">{item.label}</p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <label className={cn('relative inline-flex items-center shrink-0 mt-1', item.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer')}>
                      <input type="checkbox" defaultChecked={item.enabled} disabled={item.locked} className="sr-only peer" />
                      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-lumina-highlight" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white lowercase tracking-tighter">Security Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        placeholder="Enter current password"
                        className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-lumina-highlight/40 transition-all pr-11"
                      />
                      <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 rounded-2xl bg-black/40 border border-white/10 text-white text-sm placeholder:text-gray-700 focus:outline-none focus:border-lumina-highlight/40 transition-all"
                    />
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-teal-500/5 border border-teal-500/20 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-teal-400">Two-Factor Authentication — Active</p>
                    <p className="text-[10px] text-teal-400/70 font-medium mt-0.5">Your account is protected by 2FA. All counselor accounts require 2FA by policy.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-white/5 mt-8 flex items-center justify-between">
              {saved && (
                <div className="flex items-center gap-2 text-teal-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Saved successfully</span>
                </div>
              )}
              {!saved && <div />}
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-lg"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
