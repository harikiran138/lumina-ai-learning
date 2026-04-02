"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic2, Sparkles, Star, Play, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const AI_QUESTIONS = [
  'Tell me about a time you solved a complex engineering problem.',
  'How would you design a URL shortener system like bit.ly?',
  'What is your approach to debugging a production incident?',
  'Explain a project where you led a cross-functional team.',
  'How do you stay current with industry trends?',
];

const UPCOMING_INTERVIEWS = [
  { id: 1, mentee: 'Rahul Kumar', domain: 'Software Engineering', date: 'Today, 5:00 PM',  status: 'scheduled' },
  { id: 2, mentee: 'Sneha Iyer',  domain: 'Data Science',         date: 'Apr 6, 3:00 PM', status: 'scheduled' },
];

const COMPLETED_INTERVIEWS = [
  { id: 3, mentee: 'Vikram Singh', domain: 'Product Management', date: 'Mar 25, 2025', score: 4.2, feedback: 'Strong communication, needs to improve case structuring.' },
];

export default function MockInterviewsPage() {
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [feedback, setFeedback]             = useState('');
  const [submitted, setSubmitted]           = useState(false);
  const [tab, setTab]                       = useState<'scheduled' | 'completed'>('scheduled');

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Mock <span className="gradient-text">Interviews</span>
        </h1>
        <p className="text-gray-400 mt-1 font-medium italic">
          AI generates questions · Alumni evaluates · Combined feedback delivered to student
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { step: '01', title: 'AI Asks',            desc: 'AI generates domain-specific interview questions', icon: Sparkles, color: 'text-purple-400' },
          { step: '02', title: 'Alumni Evaluates',   desc: "You assess the student's answer in real time",    icon: Mic2,     color: 'text-amber-400' },
          { step: '03', title: 'Feedback Generated', desc: 'AI + alumni feedback sent to student',            icon: Star,     color: 'text-green-400' },
        ].map((item) => (
          <GlassCard key={item.step} className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">{item.step}</span>
              <item.icon className={cn("w-5 h-5", item.color)} />
            </div>
            <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
            <p className="text-[11px] text-gray-500">{item.desc}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* AI Question Panel */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">AI-Generated Question</h2>
              </div>
              <button
                onClick={() => setActiveQuestion((prev) => (prev + 1) % AI_QUESTIONS.length)}
                className="text-[10px] font-bold text-gray-500 hover:text-amber-400 uppercase tracking-widest transition-colors"
              >
                Next Question →
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-purple-500/10 border border-purple-500/15 mb-6">
              <p className="text-white text-base font-semibold leading-relaxed">
                {AI_QUESTIONS[activeQuestion]}
              </p>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Play className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Alumni Evaluation</span>
            </div>

            {submitted ? (
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-300 text-sm font-semibold text-center">
                ✓ Feedback submitted — student will receive the combined AI + alumni report.
              </div>
            ) : (
              <>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Evaluate the student's response: strengths, areas for improvement, industry perspective…"
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/40 resize-none mb-4"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest hover:bg-green-500/25 transition-all">
                      <ThumbsUp className="w-3.5 h-3.5" /> Strong
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all">
                      <ThumbsDown className="w-3.5 h-3.5" /> Needs Work
                    </button>
                  </div>
                  <button
                    onClick={() => setSubmitted(true)}
                    disabled={!feedback.trim()}
                    className="px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  >
                    Submit Feedback
                  </button>
                </div>
              </>
            )}
          </GlassCard>

          {/* Interview Schedule */}
          <div>
            <div className="flex gap-2 mb-4">
              {(['scheduled', 'completed'] as const).map((t) => (
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

            <div className="space-y-3">
              {(tab === 'scheduled' ? UPCOMING_INTERVIEWS : COMPLETED_INTERVIEWS).map((interview: any) => (
                <GlassCard key={interview.id} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-white text-sm">{interview.mentee}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        {interview.domain} · {interview.date}
                      </p>
                      {interview.feedback && (
                        <p className="mt-1.5 text-xs text-gray-400 italic">{interview.feedback}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {interview.score && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/15">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-amber-400 text-xs font-bold">{interview.score}</span>
                        </div>
                      )}
                      {tab === 'scheduled' && (
                        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-300 text-[11px] font-bold uppercase tracking-widest hover:bg-purple-500/25 transition-all">
                          <Play className="w-3.5 h-3.5" /> Start
                        </button>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-amber-400" />
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Interview Stats</h4>
            </div>
            <ul className="space-y-4">
              {[
                { label: 'Total Conducted',    value: '18'  },
                { label: 'Avg Feedback Score', value: '4.6' },
                { label: 'Offers Received',    value: '6'   },
              ].map((s, i) => (
                <li key={i} className="flex justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{s.label}</span>
                  <span className="text-sm font-bold text-white">{s.value}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-6">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Question Categories</h4>
            <div className="flex flex-wrap gap-2">
              {['System Design', 'Behavioural', 'DSA', 'Product Sense', 'Leadership', 'Case Study'].map((cat) => (
                <span key={cat} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {cat}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
