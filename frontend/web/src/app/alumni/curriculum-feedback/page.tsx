"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, Send, CheckCircle, Info } from 'lucide-react';
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

const SUBJECTS = [
  { id: 1, name: 'Data Structures & Algorithms', dept: 'CSE',  rating: 0, comment: '' },
  { id: 2, name: 'Machine Learning',             dept: 'CSE',  rating: 0, comment: '' },
  { id: 3, name: 'Theory of Computation',        dept: 'CSE',  rating: 0, comment: '' },
  { id: 4, name: 'Computer Networks',            dept: 'CSE',  rating: 0, comment: '' },
  { id: 5, name: 'Theory of Machines',           dept: 'Mech', rating: 0, comment: '' },
  { id: 6, name: 'Database Management Systems',  dept: 'CSE',  rating: 0, comment: '' },
];

const StarRating = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} onClick={() => onChange(star)} type="button">
        <Star
          className={cn('w-5 h-5 transition-all', star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-700 hover:text-gray-500')}
        />
      </button>
    ))}
  </div>
);

export default function CurriculumFeedbackPage() {
  const [subjects, setSubjects] = useState(SUBJECTS);
  const [submitted, setSubmitted] = useState(false);

  const updateSubject = (id: number, field: 'rating' | 'comment', value: any) =>
    setSubjects((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const avgRating = subjects.filter((s) => s.rating > 0).reduce((acc, s) => acc + s.rating, 0) /
    (subjects.filter((s) => s.rating > 0).length || 1);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Curriculum <span className="gradient-text">Feedback</span>
        </h1>
        <p className="text-gray-400 mt-1 font-medium italic">Rate subject industry relevance — feedback goes to HOD & Faculty</p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-blue-500/10 border border-blue-500/15 text-blue-200 text-xs font-medium leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <span>
          Your ratings and comments are sent directly to the <strong>Head of Department</strong> and <strong>Faculty</strong>.
          This closes the feedback loop between industry and academia. Rate honestly based on real-world applicability.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {submitted ? (
            <GlassCard className="p-12 flex flex-col items-center gap-4 text-center">
              <CheckCircle className="w-14 h-14 text-green-400" />
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Feedback Submitted</h2>
              <p className="text-gray-400 text-sm">Your curriculum feedback has been sent to the HOD and Faculty. Thank you for bridging the gap between education and industry!</p>
              <button
                onClick={() => { setSubmitted(false); setSubjects(SUBJECTS); }}
                className="mt-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Submit Another
              </button>
            </GlassCard>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {subjects.map((subject) => (
                <GlassCard key={subject.id} className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-bold text-white text-base">{subject.name}</h3>
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">{subject.dept}</span>
                    </div>
                    <StarRating value={subject.rating} onChange={(v) => updateSubject(subject.id, 'rating', v)} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-3">
                    <span>Industry Relevance</span>
                    <span className={cn(
                      subject.rating === 0 ? 'text-gray-600' :
                      subject.rating <= 2 ? 'text-red-400' :
                      subject.rating === 3 ? 'text-yellow-400' :
                      'text-green-400'
                    )}>
                      {['Not rated', 'Low', 'Below avg', 'Average', 'Good', 'Excellent'][subject.rating]}
                    </span>
                  </div>
                  <textarea
                    value={subject.comment}
                    onChange={(e) => updateSubject(subject.id, 'comment', e.target.value)}
                    placeholder="Optional: How is this used in the industry? What's missing?"
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-700 focus:outline-none focus:border-amber-500/40 resize-none"
                  />
                </GlassCard>
              ))}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                >
                  <Send className="w-4 h-4" /> Submit Feedback to HOD & Faculty
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Your Summary</h4>
            <div className="text-center mb-4">
              <p className="text-4xl font-display font-bold text-white">{avgRating.toFixed(1)}</p>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">Avg Industry Score</p>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = subjects.filter((s) => s.rating === star).length;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 font-bold w-3">{star}</span>
                    <Star className="w-3 h-3 text-amber-400" />
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(count / subjects.length) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-600 font-bold w-4">{count}</span>
                  </div>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-l-4 border-amber-500/30">
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Feedback Flow</h4>
            <div className="space-y-3">
              {[
                { from: 'You (Alumni)', to: 'HOD', color: 'text-amber-400' },
                { from: 'HOD',         to: 'Faculty', color: 'text-yellow-400' },
                { from: 'Faculty',     to: 'Curriculum Update', color: 'text-green-400' },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className={cn("font-bold", step.color)}>{step.from}</span>
                  <span className="text-gray-700">→</span>
                  <span className="text-gray-500">{step.to}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
