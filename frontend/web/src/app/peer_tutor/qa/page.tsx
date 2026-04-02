"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ThumbsUp,
  CheckCircle2,
  ArrowUpRight,
  Search,
  Plus,
  Award,
  User,
} from 'lucide-react';
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

const questions = [
  {
    id: 1,
    question: 'Explain recursion with a real-world example',
    askedBy: 'Arjun S. · 1st year',
    subject: 'Data Structures',
    time: '2m ago',
    upvotes: 4,
    status: 'open',
    priority: 'high',
  },
  {
    id: 2,
    question: 'What is the difference between == and === in JavaScript?',
    askedBy: 'Priya K. · 2nd year',
    subject: 'JavaScript',
    time: '7m ago',
    upvotes: 2,
    status: 'open',
    priority: 'medium',
  },
  {
    id: 3,
    question: 'How does gradient descent work in machine learning?',
    askedBy: 'Rohan T. · 3rd year',
    subject: 'Machine Learning',
    time: '15m ago',
    upvotes: 7,
    status: 'answered',
    priority: 'medium',
  },
  {
    id: 4,
    question: 'Can you explain Big-O notation with examples?',
    askedBy: 'Neha R. · 1st year',
    subject: 'Algorithms',
    time: '30m ago',
    upvotes: 9,
    status: 'validated',
    priority: 'low',
  },
];

export default function PeerQAPage() {
  const [activeTab, setActiveTab] = useState<'open' | 'answered' | 'validated'>('open');
  const [search, setSearch] = useState('');

  const filtered = questions.filter((q) => {
    const matchTab =
      activeTab === 'open'      ? q.status === 'open' :
      activeTab === 'answered'  ? q.status === 'answered' :
                                  q.status === 'validated';
    const matchSearch =
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.subject.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Peer <span className="gradient-text">Q&amp;A</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Answer student doubts · earn credits · get faculty validation</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
          <Plus className="w-4 h-4" /> Post Answer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Questions Answered', value: '148', icon: MessageSquare, color: 'text-lumina-primary' },
          { label: 'Upvotes Received',   value: '312', icon: ThumbsUp,      color: 'text-amber-400' },
          { label: 'Faculty Validated',  value: '54',  icon: CheckCircle2,  color: 'text-green-400' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-6">
            <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-8">
        {/* Tabs + Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            {(['open', 'answered', 'validated'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all',
                  activeTab === tab ? 'bg-lumina-primary text-black' : 'text-gray-500 hover:text-white'
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white placeholder-gray-600 outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        {/* Question list */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <p className="text-center text-gray-600 py-12 text-sm">No questions found.</p>
          )}
          {filtered.map((q) => (
            <div key={q.id} className="flex items-start gap-4 p-6 rounded-2xl glass-v2 border border-white/5 hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-snug mb-1">{q.question}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-gray-400 font-bold">Asked by: {q.askedBy}</span>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{q.subject}</span>
                  <span className="text-[10px] text-gray-600">{q.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500">
                  <ThumbsUp className="w-3 h-3" /> {q.upvotes}
                </div>
                {q.priority === 'high' && (
                  <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 text-[8px] font-bold uppercase tracking-wider border border-red-500/20">
                    High
                  </span>
                )}
                <span className={cn(
                  'px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border',
                  q.status === 'validated' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  q.status === 'answered'  ? 'bg-lumina-primary/10 text-lumina-primary border-lumina-primary/20' :
                                             'bg-amber-500/10 text-amber-400 border-amber-500/20'
                )}>
                  {q.status}
                </span>
                {q.status === 'open' && (
                  <button className="px-3 py-1.5 rounded-xl bg-lumina-primary text-black font-bold text-xs hover:scale-105 transition-all flex items-center gap-1.5">
                    Answer <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6 bg-gradient-to-r from-amber-500/5 via-transparent to-transparent border border-amber-500/10">
        <div className="flex items-center gap-4">
          <Award className="w-8 h-8 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-bold text-white">Earn credits for every answer</p>
            <p className="text-xs text-gray-500 mt-0.5">Answer → +1 · Highlighted answer → +3 · Faculty validated → +5</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
