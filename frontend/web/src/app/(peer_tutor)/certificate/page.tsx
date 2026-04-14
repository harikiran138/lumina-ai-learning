"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText, Award, Download, CheckCircle2, ExternalLink } from 'lucide-react';
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

const TOTAL_CREDITS = 1240;
const THRESHOLD = 1000;
const isEligible = TOTAL_CREDITS >= THRESHOLD;

const milestones = [
  { label: 'Bronze Mentor',  threshold: 100,  achieved: true,  description: 'First 100 credits earned' },
  { label: 'Silver Mentor',  threshold: 500,  achieved: true,  description: '500 credits & 10+ sessions' },
  { label: 'Gold Mentor',    threshold: 1000, achieved: true,  description: '1000 credits & faculty recognition' },
  { label: 'Platinum Mentor',threshold: 2000, achieved: false, description: '2000 credits & 50+ sessions' },
];

export default function CertificatePage() {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            <span className="gradient-text">Certificate</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Auto-generated once credit threshold is reached</p>
        </div>
        {isEligible && (
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Download className="w-4 h-4" /> Download Certificate
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Certificate preview */}
        <div className="lg:col-span-2">
          <GlassCard className="p-8">
            {isEligible ? (
              <div className="relative rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-white/[0.02] to-transparent p-10 text-center overflow-hidden">
                <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-amber-500/10 blur-2xl" />
                <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-amber-500/5 blur-3xl" />
                <div className="relative">
                  <ScrollText className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-[0.4em] mb-3">Certificate of Achievement</p>
                  <h2 className="text-3xl font-display font-bold text-white mb-2">Peer Mentor</h2>
                  <p className="text-sm text-gray-400 mb-6">This certifies that</p>
                  <p className="text-2xl font-bold text-white mb-6">Alex Johnson</p>
                  <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed mb-8">
                    has successfully completed the Peer Mentor program, demonstrating exceptional commitment to peer learning, earning <strong className="text-amber-400">1,240 credits</strong> over a period of <strong className="text-white">3 months</strong>.
                  </p>
                  <div className="flex items-center justify-center gap-8 mb-8">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">1,240</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Credits</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">3 Months</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Duration</p>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">Gold</p>
                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-0.5">Level</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                    <ExternalLink className="w-3 h-3" />
                    <span>Verify at lumina.ai/verify/PM-2024-AJ-1240</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <ScrollText className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                <p className="text-lg font-bold text-white mb-2">Not yet eligible</p>
                <p className="text-sm text-gray-500">Reach {THRESHOLD} credits to unlock your certificate.</p>
                <div className="mt-6 max-w-xs mx-auto">
                  <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                    <span>{TOTAL_CREDITS} credits</span>
                    <span>{THRESHOLD} required</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${Math.min((TOTAL_CREDITS / THRESHOLD) * 100, 100)}%` }} />
                  </div>
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Milestones */}
        <div>
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Milestones</h2>
            </div>
            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.label} className={cn('p-4 rounded-2xl border transition-all', m.achieved ? 'glass-v2 border-amber-500/20' : 'glass-v2 border-white/5 opacity-50')}>
                  <div className="flex items-center gap-3 mb-1">
                    <CheckCircle2 className={cn('w-4 h-4 shrink-0', m.achieved ? 'text-amber-400' : 'text-gray-700')} />
                    <span className={cn('text-sm font-bold', m.achieved ? 'text-white' : 'text-gray-600')}>{m.label}</span>
                    <span className="ml-auto text-[10px] font-bold text-gray-600">{m.threshold}+</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-7">{m.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
