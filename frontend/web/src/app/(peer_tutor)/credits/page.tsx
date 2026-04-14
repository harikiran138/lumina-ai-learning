"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  TrendingUp,
  MessageSquare,
  Users,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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

const weeklyCredits = [
  { day: 'Mon', credits: 12 },
  { day: 'Tue', credits: 18 },
  { day: 'Wed', credits: 8  },
  { day: 'Thu', credits: 25 },
  { day: 'Fri', credits: 15 },
  { day: 'Sat', credits: 30 },
  { day: 'Sun', credits: 22 },
];

const creditRules = [
  { action: 'Answer a question',     icon: MessageSquare, credit: '+1',  color: 'text-lumina-primary',  bg: 'bg-lumina-primary/10' },
  { action: 'Highlighted answer',    icon: Star,          credit: '+3',  color: 'text-amber-400',       bg: 'bg-amber-500/10' },
  { action: 'Session hosted',        icon: Users,         credit: '+5',  color: 'text-blue-400',        bg: 'bg-blue-500/10' },
  { action: 'Faculty recognition',   icon: Award,         credit: '+10', color: 'text-yellow-400',      bg: 'bg-yellow-500/10' },
];

const history = [
  { action: 'Answered: Recursion question',           credit: '+1',  time: '2h ago',    type: 'answer' },
  { action: 'Session: DSA Mastery Squad',             credit: '+5',  time: 'Yesterday', type: 'session' },
  { action: 'Highlighted answer: Big-O notation',     credit: '+3',  time: '2 days ago',type: 'highlight' },
  { action: 'Answered: JavaScript == vs ===',         credit: '+1',  time: '3 days ago',type: 'answer' },
  { action: 'Faculty recognition from Prof. Sharma',  credit: '+10', time: '1 week ago', type: 'recognition' },
];

export default function MentorCreditsPage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Mentor <span className="gradient-text">Credits</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Every action counts · watch your credits grow</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-2xl font-bold text-white">1,240</span>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Total Credits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Weekly trend */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Weekly Earnings</h2>
              <TrendingUp className="w-5 h-5 text-lumina-primary" />
            </div>
            <div className="h-52">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyCredits}>
                    <defs>
                      <linearGradient id="credGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#bf9304" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#bf9304" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="p-2 rounded-lg bg-black/80 border border-white/10 text-[10px] font-bold text-white">
                            {payload[0].value} Credits
                          </div>
                        ) : null
                      }
                    />
                    <Area type="monotone" dataKey="credits" stroke="#bf9304" fillOpacity={1} fill="url(#credGradient)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
          </GlassCard>

          {/* Credit history */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Credit History</h2>
            <div className="space-y-4">
              {history.map((h, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-2xl glass-v2 border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{h.action}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{h.time}</p>
                  </div>
                  <span className="text-base font-bold text-amber-400 shrink-0">{h.credit}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right panel */}
        <div className="space-y-8">
          {/* Credit rules */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">How to Earn</h2>
            <div className="space-y-4">
              {creditRules.map((rule) => (
                <div key={rule.action} className="flex items-center gap-4 p-4 rounded-2xl glass-v2 border border-white/5">
                  <div className={cn('p-2.5 rounded-xl', rule.bg)}>
                    <rule.icon className={cn('w-4 h-4', rule.color)} />
                  </div>
                  <span className="flex-1 text-sm text-gray-300 font-medium">{rule.action}</span>
                  <span className={cn('text-xl font-bold', rule.color)}>{rule.credit}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Milestones */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Credit Milestones</h2>
            <div className="space-y-4">
              {[
                { label: 'First 100 Credits',  threshold: 100,  achieved: true },
                { label: 'Top Contributor',    threshold: 500,  achieved: true },
                { label: 'Elite Mentor',       threshold: 1000, achieved: true },
                { label: 'Certified Expert',   threshold: 2000, achieved: false },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl glass-v2 border border-white/5">
                  <CheckCircle2 className={cn('w-4 h-4 shrink-0', m.achieved ? 'text-green-400' : 'text-gray-700')} />
                  <span className={cn('text-xs font-bold', m.achieved ? 'text-white' : 'text-gray-600')}>{m.label}</span>
                  <span className="ml-auto text-[10px] font-bold text-gray-600">{m.threshold}+</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
