"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const Toggle = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={cn(
      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
      enabled ? 'bg-amber-500' : 'bg-white/10',
    )}
  >
    <span className={cn('inline-block h-4 w-4 rounded-full bg-white shadow transition-transform', enabled ? 'translate-x-6' : 'translate-x-1')} />
  </button>
);

const TABS = ['Profile', 'Notifications', 'Privacy'] as const;
type Tab = typeof TABS[number];

export default function AlumniSettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('Profile');
  const [saved, setSaved]         = useState(false);

  const [profile, setProfile] = useState({
    name:     user?.name     ?? '',
    email:    user?.email    ?? '',
    headline: 'Data Scientist & Mentorship Advocate',
    company:  'Acme Corp',
    linkedin: '',
    github:   '',
    bio:      '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    menteeRequests:  true,
    sessionReminders: true,
    jobUpdates:      true,
    feedbackAlerts:  false,
    networkUpdates:  false,
    weeklyDigest:    true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible:    true,
    showBatch:         true,
    allowDirectMsg:    true,
    showJobPosts:      true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-gray-400 mt-1 font-medium italic">Manage your alumni profile, notifications, and privacy</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
              activeTab === tab
                ? 'bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30'
                : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Profile Tab */}
          {activeTab === 'Profile' && (
            <GlassCard className="p-8">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" /> Profile Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'name',     label: 'Full Name',          placeholder: 'Your full name'     },
                  { key: 'email',    label: 'Email',              placeholder: 'your@email.com'     },
                  { key: 'headline', label: 'Professional Headline', placeholder: 'e.g. SWE @ Google' },
                  { key: 'company',  label: 'Current Company',    placeholder: 'e.g. Acme Corp'     },
                  { key: 'linkedin', label: 'LinkedIn URL',       placeholder: 'linkedin.com/in/…'  },
                  { key: 'github',   label: 'GitHub URL',         placeholder: 'github.com/…'       },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{field.label}</label>
                    <input
                      type="text"
                      value={(profile as any)[field.key]}
                      onChange={(e) => setProfile((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                    placeholder="Brief bio about your journey and expertise…"
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none"
                  />
                </div>
              </div>
            </GlassCard>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <GlassCard className="p-8">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" /> Notification Preferences
              </h2>
              <div className="space-y-5">
                {(Object.entries(notifPrefs) as [keyof typeof notifPrefs, boolean][]).map(([key, val]) => {
                  const labels: Record<keyof typeof notifPrefs, string> = {
                    menteeRequests:   'New Mentee Requests',
                    sessionReminders: 'Session Reminders',
                    jobUpdates:       'Job Post Updates',
                    feedbackAlerts:   'Curriculum Feedback Alerts',
                    networkUpdates:   'Alumni Network Updates',
                    weeklyDigest:     'Weekly Activity Digest',
                  };
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <span className="text-sm font-semibold text-gray-300">{labels[key]}</span>
                      <Toggle enabled={val} onChange={() => setNotifPrefs((p) => ({ ...p, [key]: !val }))} />
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          {/* Privacy Tab */}
          {activeTab === 'Privacy' && (
            <GlassCard className="p-8">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" /> Privacy Controls
              </h2>
              <div className="space-y-5">
                {(Object.entries(privacy) as [keyof typeof privacy, boolean][]).map(([key, val]) => {
                  const labels: Record<keyof typeof privacy, string> = {
                    profileVisible: 'Make my profile visible to students',
                    showBatch:      'Show my graduation batch year',
                    allowDirectMsg: 'Allow direct messages from students',
                    showJobPosts:   'Show my job posts publicly',
                  };
                  return (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <span className="text-sm font-semibold text-gray-300">{labels[key]}</span>
                      <Toggle enabled={val} onChange={() => setPrivacy((p) => ({ ...p, [key]: !val }))} />
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
            >
              {saved ? '✓ Saved!' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Avatar card */}
          <GlassCard className="p-6">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Profile Picture</h4>
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10">
                <img
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name ?? 'Alumni')}&background=random&size=80`}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-all">
                Change Photo
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-l-4 border-amber-500/30">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Access Policy</h4>
            <ul className="space-y-2 text-[11px] text-gray-500">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> View assigned mentees</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Conduct sessions & interviews</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Post jobs & internships</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> View all students</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> Access academic grades</li>
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
