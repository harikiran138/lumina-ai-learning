"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, MessageCircle, Calendar, TrendingUp, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';

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

const MOCK_MENTEES = [
  { id: 1, name: 'Rahul Kumar',    major: 'Computer Science', year: 'Final Year', careerGoal: 'SWE @ FAANG',    sessions: 8, progress: 72, avatar: '' },
  { id: 2, name: 'Sneha Iyer',     major: 'Data Science',     year: 'Pre-Final',  careerGoal: 'Data Analyst',   sessions: 5, progress: 55, avatar: '' },
  { id: 3, name: 'Vikram Singh',   major: 'CSE',              year: 'Final Year', careerGoal: 'Product Manager', sessions: 3, progress: 40, avatar: '' },
];

export default function MyMenteesPage() {
  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.getAlumniMentorshipMentees()
      .then((data: any[]) => setMentees(data.length ? data : MOCK_MENTEES))
      .catch(() => setMentees(MOCK_MENTEES))
      .finally(() => setLoading(false));
  }, []);

  const filtered = mentees.filter((m) =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.major?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            My <span className="gradient-text">Mentees</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Track and guide your assigned students — career-focused view only</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search mentees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 w-60"
          />
        </div>
      </div>

      {/* Permission notice */}
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/15 text-blue-300 text-xs font-bold uppercase tracking-widest">
        <BookOpen className="w-4 h-4 shrink-0" />
        Career-focused view only — academic scores are not visible to alumni
      </div>

      {/* Mentees Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-white/5 bg-white/[0.02] text-gray-600 italic font-display">
          No mentees found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((mentee) => (
            <GlassCard key={mentee.id} className="p-6 hover:border-amber-500/20 transition-all group">
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 shrink-0">
                  <img
                    src={mentee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentee.name)}&background=random`}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base lowercase tracking-tighter">{mentee.name}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{mentee.major} · {mentee.year}</p>
                </div>
              </div>

              {/* Career goal */}
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-300 font-semibold">{mentee.careerGoal || 'Career goal not set'}</span>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                  <span>Career Progress</span>
                  <span>{mentee.progress ?? 0}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${mentee.progress ?? 0}%` }} />
                </div>
              </div>

              {/* Stats + actions */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                  {mentee.sessions ?? 0} sessions
                </span>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <Link href="/alumni/sessions">
                    <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-widest hover:bg-amber-500/25 transition-all">
                      <Calendar className="w-3.5 h-3.5" /> Schedule
                    </button>
                  </Link>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
