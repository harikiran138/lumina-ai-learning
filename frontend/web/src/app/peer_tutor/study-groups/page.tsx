"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, PlayCircle, Clock, BookOpen, Bot, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

const groups = [
  { id: 1, name: 'DSA Mastery Squad', subject: 'Data Structures', members: 8, nextSession: 'Today, 5:00 PM', status: 'active', aiEnabled: true },
  { id: 2, name: 'JS Deep Dive',       subject: 'JavaScript',      members: 5, nextSession: 'Tomorrow, 4:00 PM', status: 'active', aiEnabled: true },
  { id: 3, name: 'ML Foundations',    subject: 'Machine Learning', members: 6, nextSession: 'Wed, 6:00 PM',      status: 'scheduled', aiEnabled: false },
  { id: 4, name: 'Physics Warriors',  subject: 'Physics',          members: 4, nextSession: 'Thu, 3:30 PM',      status: 'scheduled', aiEnabled: true },
];

export default function StudyGroupsPage() {
  const [tab, setTab] = useState<'my' | 'discover'>('my');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Study <span className="gradient-text">Groups</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Create or join groups · host sessions · AI-assisted moderation</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Active Groups',    value: '6',    icon: Users,       color: 'text-amber-400' },
          { label: 'Sessions Hosted',  value: '34',   icon: PlayCircle,  color: 'text-lumina-primary' },
          { label: 'Avg. Group Size',  value: '5.8',  icon: BookOpen,    color: 'text-green-400' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-6">
            <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-8">
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 w-fit mb-8">
          {(['my', 'discover'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                tab === t ? 'bg-lumina-primary text-black' : 'text-gray-500 hover:text-white'
              )}
            >
              {t === 'my' ? 'My Groups' : 'Discover'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((g) => (
            <div key={g.id} className="p-6 rounded-2xl glass-v2 border border-white/5 hover:border-white/15 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-base">{g.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{g.subject}</p>
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border',
                  g.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                )}>
                  {g.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mb-5 text-xs text-gray-500">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {g.members} members</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {g.nextSession}</span>
                {g.aiEnabled && <span className="flex items-center gap-1 text-lumina-primary"><Bot className="w-3 h-3" /> AI</span>}
              </div>
              <button className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2 group-hover:border-white/20">
                {g.status === 'active' ? <><PlayCircle className="w-3.5 h-3.5" /> Join Session</> : <><ChevronRight className="w-3.5 h-3.5" /> View Group</>}
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 bg-gradient-to-r from-lumina-primary/5 via-transparent to-transparent border border-lumina-primary/10">
        <div className="flex items-center gap-4">
          <Bot className="w-8 h-8 text-lumina-primary shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">AI-Assisted Moderation</p>
            <p className="text-xs text-gray-500 mt-0.5">Mentor leads · AI supports · Students learn. AI flags off-topic discussions and suggests resources.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
