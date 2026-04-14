"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, MessageSquare, Plus, Clock, CheckCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

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

const UPCOMING = [
  { id: 1, mentee: 'Rahul Kumar',  topic: 'System Design Prep',    date: 'Today, 4:00 PM',     type: 'video' },
  { id: 2, mentee: 'Sneha Iyer',   topic: 'Resume Review',         date: 'Tomorrow, 11:00 AM', type: 'chat'  },
  { id: 3, mentee: 'Vikram Singh', topic: 'DSA Mock Interview',    date: 'Apr 5, 2:00 PM',     type: 'video' },
];

const COMPLETED = [
  { id: 4, mentee: 'Rahul Kumar', topic: 'Introduction Call',      date: 'Mar 20, 2025', type: 'video', notes: 'Good progress on arrays & strings.' },
  { id: 5, mentee: 'Sneha Iyer',  topic: 'LinkedIn Optimisation',  date: 'Mar 15, 2025', type: 'chat',  notes: 'Updated headline and summary section.' },
];

const TypeIcon = ({ type }: { type: string }) =>
  type === 'video'
    ? <Video className="w-4 h-4 text-purple-400" />
    : <MessageSquare className="w-4 h-4 text-blue-400" />;

export default function MentorshipSessionsPage() {
  const [tab, setTab]         = useState<'upcoming' | 'completed'>('upcoming');
  const [noteOpen, setNoteOpen] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  const list = tab === 'upcoming' ? UPCOMING : COMPLETED;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Mentorship <span className="gradient-text">Sessions</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Schedule, conduct and review your mentorship interactions</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] w-fit">
          <Plus className="w-4 h-4" /> Schedule Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['upcoming', 'completed'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all',
              tab === t
                ? 'bg-lumina-highlight/15 text-lumina-highlight border border-lumina-highlight/30'
                : 'bg-white/5 text-gray-500 border border-white/5 hover:text-gray-300',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {list.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-white/5 bg-white/[0.02] text-gray-600 italic font-display">
              No {tab} sessions.
            </div>
          ) : (
            list.map((session: any) => (
              <GlassCard key={session.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                      <TypeIcon type={session.type} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{session.topic}</h3>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {session.mentee} · <Clock className="inline w-3 h-3 mb-0.5" /> {session.date}
                      </p>
                      {session.notes && (
                        <p className="mt-2 text-xs text-gray-400 italic">{session.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {tab === 'upcoming' && (
                      <>
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-widest hover:bg-purple-500/25 transition-all">
                          <Video className="w-3.5 h-3.5" /> Join
                        </button>
                        <button
                          onClick={() => { setNoteOpen(session.id); setNoteText(''); }}
                          className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all"
                          title="Add note"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {tab === 'completed' && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/15 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                        <CheckCircle className="w-3 h-3" /> Done
                      </span>
                    )}
                  </div>
                </div>

                {noteOpen === session.id && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Session notes…"
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setNoteOpen(null)}
                        className="px-4 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest hover:bg-amber-500/25 transition-all"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setNoteOpen(null)}
                        className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))
          )}
        </div>

        {/* Sidebar tips */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Session Guidelines</h4>
            <ul className="space-y-3">
              {[
                'Set a clear agenda before each call',
                'Share video call link at least 30 min early',
                'Log session notes within 24 hrs',
                'Keep feedback career-focused',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Video Integration</h4>
            <div className="space-y-2">
              {['Zoom', 'Google Meet', 'Microsoft Teams'].map((platform) => (
                <button
                  key={platform}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-amber-500/20 transition-all text-sm text-gray-400 hover:text-white"
                >
                  <Video className="w-4 h-4 text-gray-600" />
                  {platform}
                </button>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
