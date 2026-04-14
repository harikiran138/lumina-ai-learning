"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Star, BarChart2, TrendingUp, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ClientOnlyChart } from '@/components/charts/ClientOnlyChart';

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

const ratingData = [
  { label: '5★', count: 42 },
  { label: '4★', count: 18 },
  { label: '3★', count: 6  },
  { label: '2★', count: 2  },
  { label: '1★', count: 1  },
];

const reviews = [
  { user: 'Arjun S.',  rating: 5, msg: 'Explained recursion so clearly with a real-world example. Loved it!', context: 'Q&A' },
  { user: 'Priya K.',  rating: 5, msg: 'Patient, thorough, and very relatable. Better than textbooks.', context: 'Study Group' },
  { user: 'Rohan T.',  rating: 4, msg: 'Helpful session on ML. Could spend more time on backprop.', context: 'Session' },
  { user: 'Neha R.',   rating: 5, msg: 'Cleared my Big-O confusion in 5 minutes. Fantastic!', context: 'Q&A' },
  { user: 'Karan M.',  rating: 5, msg: 'Best mentor I\'ve had. Goes above and beyond.', context: 'Study Group' },
];

export default function FeedbackPage() {
  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            <span className="gradient-text">Feedback</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Student ratings · answer quality · session effectiveness</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Star className="w-5 h-5 text-amber-400 fill-current" />
          <span className="text-2xl font-bold text-white">{avgRating}</span>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Avg. Rating</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5">
        {[
          { label: 'Total Reviews',     value: String(reviews.length), icon: MessageSquare, color: 'text-lumina-primary' },
          { label: 'Average Rating',    value: avgRating + '★',        icon: Star,          color: 'text-amber-400' },
          { label: 'Session Rating',    value: '4.8★',                 icon: TrendingUp,    color: 'text-green-400' },
        ].map((s) => (
          <GlassCard key={s.label} className="p-6">
            <s.icon className={cn('w-5 h-5 mb-3', s.color)} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Student Reviews</h2>
            <div className="space-y-5">
              {reviews.map((r, i) => (
                <div key={i} className="p-5 rounded-2xl glass-v2 border border-white/5 hover:border-white/10 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center font-bold text-white text-sm">
                        {r.user[0]}
                      </div>
                      <span className="text-sm font-bold text-white">{r.user}</span>
                      <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">{r.context}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={cn('w-3 h-3', j < r.rating ? 'text-amber-500 fill-current' : 'text-gray-700')} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 italic leading-relaxed">"{r.msg}"</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart2 className="w-5 h-5 text-lumina-primary" />
              <h2 className="text-xl font-bold text-white">Rating Distribution</h2>
            </div>
            <div className="h-52">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ratingData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="p-2 rounded-lg bg-black/80 border border-white/10 text-[10px] font-bold text-white">
                            {payload[0].value} reviews
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="count" fill="#bf9304" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
