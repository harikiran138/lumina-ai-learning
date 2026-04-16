"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  History, 
  Search, 
  Filter, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  Eye, 
  Lock,
  Calendar,
  User,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
         'rounded-3xl border border-border bg-surface-elevated shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function SafeguardingLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // In a real app, we'd fetch from a specific safeguarding log endpoint
        // For now, we'll simulate some logs
        setTimeout(() => {
          setLogs([
            { id: 'LOG-001', type: 'Identity Reveal', severity: 'medium', description: 'Escalation to senior safeguarding lead for student burnout investigation.', timestamp: '2026-03-15 14:20', counselor: 'Dr. Sarah Smith' },
            { id: 'LOG-002', type: 'Risk Alert Dismissed', severity: 'low', description: 'Sentiment dip confirmed as false positive due to sarcasm detection.', timestamp: '2026-03-15 12:45', counselor: 'Dr. Sarah Smith' },
            { id: 'LOG-003', type: 'Intervention Started', severity: 'high', description: 'Crisis management protocol initiated for severe emotional distress markers.', timestamp: '2026-03-15 09:15', counselor: 'Admin System' }
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };
    fetchLogs();
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
         case 'high': return 'bg-danger/10 text-danger border-danger/20';
         case 'medium': return 'bg-warning/10 text-warning border-warning/20';
         default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
               <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Safeguarding <span className="gradient-text">Logs</span>
          </h1>
               <p className="text-text-muted mt-1 font-medium italic">Immutable audit trail of counseling interventions and security actions</p>
        </div>
        
        <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-foreground transition-all font-bold text-sm uppercase tracking-widest">
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <GlassCard className="p-8">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-[0.2em] mb-6">Audit Filters</h3>
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Risk Severity</label>
                    <div className="flex flex-wrap gap-2">
                       {['Low', 'Medium', 'High'].map(s => (
                         <button key={s} className="px-3 py-1.5 rounded-lg bg-surface border border-border text-[10px] font-bold text-text-muted hover:text-foreground transition-all">{s}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-1">Event Type</label>
                    <select className="w-full px-4 py-2.5 rounded-xl glass-v2 border-border text-foreground text-[10px] font-bold appearance-none">
                       <option>All Activities</option>
                       <option>Identity Reveals</option>
                       <option>Sentiment Alerts</option>
                       <option>Case Closures</option>
                    </select>
                 </div>
                 <button className="w-full py-2.5 rounded-xl bg-warning text-warning-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-warning/20">Apply Filters</button>
              </div>
           </GlassCard>

           <GlassCard className="p-8 bg-gradient-to-br from-warning/10 to-transparent border-warning/20">
              <div className="flex items-center gap-3 mb-4">
                 <Shield className="w-5 h-5 text-warning" />
                 <h4 className="font-bold text-foreground text-xs uppercase tracking-widest">Compliance Status</h4>
              </div>
              <p className="text-[10px] text-warning font-medium leading-relaxed italic mb-4">
                 All logs are being synchronized with the Lumina Secure Vault. Last audited 4h ago.
              </p>
              <div className="flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4 text-warning" />
                 <span className="text-[10px] text-foreground font-bold">Protocol v4.2 Active</span>
              </div>
           </GlassCard>
        </div>

        <div className="lg:col-span-3">
           <div className="space-y-4">
              {loading ? (
                 [1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-surface rounded-3xl animate-pulse"></div>)
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <GlassCard key={log.id} className="p-6 group hover:border-border transition-all">
                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-5">
                           <div className={cn(
                             "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0",
                             getSeverityStyles(log.severity)
                           )}>
                              <AlertTriangle className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                 <h4 className="text-lg font-bold text-foreground lowercase tracking-tighter">{log.type}</h4>
                                 <span className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{log.id}</span>
                              </div>
                              <p className="text-xs text-text-muted font-medium italic mb-2 leading-relaxed max-w-xl">
                                 "{log.description}"
                              </p>
                              <div className="flex items-center gap-4">
                                 <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-bold uppercase tracking-[0.1em]">
                                    <Calendar className="w-3 h-3 text-warning" /> {log.timestamp}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-[9px] text-text-muted font-bold uppercase tracking-[0.1em]">
                                    <User className="w-3 h-3 text-warning" /> {log.counselor}
                                 </div>
                              </div>
                           </div>
                        </div>
                        <button className="flex items-center gap-1 text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-foreground transition-colors group-hover:gap-2">
                           View Full Record <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                     </div>
                  </GlassCard>
                ))
              ) : (
                 <div className="h-64 flex flex-col items-center justify-center glass-v2 rounded-3xl opacity-30 italic font-display text-text-muted">
                    No safeguarding logs found for the selected period.
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
