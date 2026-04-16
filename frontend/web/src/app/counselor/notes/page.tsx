"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Shield, 
  Eye, 
  EyeOff, 
  FileText, 
  Save, 
  History, 
  Search, 
  ChevronRight, 
  AlertTriangle,
  Send,
  Trash2,
  Clock,
  Info,
  CheckCircle2,
  X,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className={cn(
         'rounded-3xl border border-border bg-surface-elevated backdrop-blur-2xl shadow-sm overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function CounselorNotes() {
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [noteContent, setNoteContent] = useState("");
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealJustification, setRevealJustification] = useState("");
  const [showRevealModal, setShowRevealModal] = useState(false);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const c = await api.getCounselorCases();
        setCases(c);
      } catch (err) {
        console.error("Error fetching cases:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleRevealIdentity = async () => {
    if (!revealJustification) return;
    // Log safeguarding event
    try {
      await api.logSafeguardingEvent({
        student_id: selectedCase.student_id,
        event_type: 'identity_reveal',
        reason: revealJustification,
      });
      setShowRevealModal(false);
      setIsEncrypted(false);
    } catch (err) {
      console.error("Safeguarding log failed:", err);
    }
  };

  return (
      <div className="space-y-8 pb-12 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
               <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Secure <span className="gradient-text">Documentation</span>
          </h1>
               <p className="text-text-secondary mt-1 font-medium italic">End-to-end encrypted student support logs</p>
        </div>
        
        <div className="flex items-center gap-3">
               <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-foreground transition-all font-bold text-sm uppercase tracking-widest">
                  <History className="w-4 h-4" /> Vault History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Cases List */}
        <div className="lg:col-span-1 space-y-6">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input 
                type="text" 
                placeholder="Search secure cases..." 
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all font-medium shadow-inner"
              />
           </div>

           <div className="space-y-3">
              {loading ? (
                 [1, 2, 3].map(i => <div key={i} className="h-20 bg-surface rounded-3xl animate-pulse"></div>)
              ) : cases.length > 0 ? (
                cases.map((scase) => (
                  <div 
                    key={scase.case_id}
                    onClick={() => {
                        setSelectedCase(scase);
                        setIsEncrypted(true);
                    }}
                    className={cn(
                      "p-5 rounded-3xl border transition-all cursor-pointer group",
                      selectedCase?.case_id === scase.case_id 
                                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                                    : "bg-surface border-border hover:bg-surface-elevated"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Case {scase.case_id}</span>
                                  <Lock className={cn("w-3.5 h-3.5", selectedCase?.case_id === scase.case_id ? "text-primary" : "text-text-muted")} />
                    </div>
                              <h4 className="font-bold text-foreground text-base lowercase tracking-tighter truncate">
                       {isEncrypted && selectedCase?.case_id === scase.case_id ? "******** ********" : scase.student_initials || "Session Participant"}
                    </h4>
                              <p className="text-[10px] text-text-muted mt-1 font-medium">{scase.last_updated || 'Last updated 1h ago'}</p>
                  </div>
                ))
              ) : (
                        <div className="py-12 text-center opacity-30 italic text-sm text-text-muted">No cases found...</div>
              )}
           </div>
        </div>

        {/* Documentation Workspace */}
        <div className="lg:col-span-3">
           {selectedCase ? (
             <GlassCard className="p-8 h-full flex flex-col min-h-[600px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border mb-8">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                         <Shield className="w-8 h-8 text-primary" />
                      </div>
                      <div>
                         <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-foreground lowercase tracking-tighter">
                               {isEncrypted ? "Anonymous Case Participant" : selectedCase.student_name || "Full Identity Revealed"}
                            </h2>
                            <span className="px-2 py-0.5 rounded-lg bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">Encrypted</span>
                         </div>
                         <p className="text-xs text-text-muted font-medium lowercase tracking-tighter mt-1">Ref: {selectedCase.case_id} • Assigned Counselor Case</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-3">
                      <button 
                         onClick={() => {
                            if (isEncrypted) setShowRevealModal(true);
                            else setIsEncrypted(true);
                         }}
                         className={cn(
                           "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all uppercase tracking-widest border",
                           isEncrypted 
                                ? "bg-surface border-border text-text-secondary hover:text-foreground" 
                                : "bg-primary/10 border-primary/30 text-primary shadow-lg"
                         )}
                      >
                         {isEncrypted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                         {isEncrypted ? "Reveal Identity" : "Hide Identity"}
                      </button>
                         <button className="p-2.5 rounded-xl bg-surface border border-border text-text-muted hover:text-foreground transition-all">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                   </div>
                </div>

                <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                         <Info className="w-4 h-4 text-primary shrink-0" />
                         <p className="text-[10px] text-text-muted font-medium italic">
                         Lumina zero-knowledge encryption: These notes are encrypted using your session key. Even Lumina administrators cannot read these contents without your explicit authorization.
                      </p>
                   </div>

                   <div className="relative group">
                      <textarea 
                           className="w-full h-80 p-8 rounded-3xl bg-surface border border-border text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-all text-sm font-medium resize-none shadow-inner leading-relaxed"
                        placeholder="Begin documenting session outcomes, risk observations, and intervention strategies..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                      ></textarea>
                      <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none opacity-50">
                            <Lock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-[8px] font-bold text-text-muted uppercase tracking-[0.2em]">End-to-End Secure</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="p-6 rounded-3xl bg-surface border border-border">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Sentiment Score Snapshot</h4>
                         <div className="flex items-center justify-between">
                            <div className="flex items-baseline gap-1">
                                  <span className="text-2xl font-bold text-foreground">64</span>
                                  <span className="text-xs font-bold text-text-muted">/ 100</span>
                            </div>
                               <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg">Moderate Concern</span>
                         </div>
                      </div>
                         <div className="p-6 rounded-3xl bg-surface border border-border">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Intervention Status</h4>
                         <div className="flex items-center gap-3">
                               <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                               <span className="text-sm font-bold text-foreground">Active Monitoring</span>
                         </div>
                      </div>
                   </div>
                </div>

                   <div className="pt-8 border-t border-border mt-8 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                         <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Auto-saved to Vault</span>
                      </div>
                         <span className="text-[10px] text-text-secondary font-medium">15:42 GMT</span>
                   </div>
                      <button className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg">
                      Finalize Documentation <Save className="w-4 h-4 ml-1" />
                   </button>
                </div>
             </GlassCard>
           ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-surface rounded-3xl border border-dashed border-border opacity-80">
                   <div className="p-8 rounded-full bg-surface-elevated mb-8 border border-border">
                      <Lock className="w-16 h-16 text-text-muted" />
                </div>
                   <h3 className="text-2xl font-bold text-text-muted lowercase tracking-tighter">Documentation Vault</h3>
                   <p className="text-sm text-text-secondary max-w-sm mt-2 font-medium italic">Select a case from the sidebar to access end-to-end encrypted session logs.</p>
             </div>
           )}
        </div>
      </div>

      {/* Identity Reveal Modal */}
      <AnimatePresence>
         {showRevealModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
               <motion.div 
                 initial={{ opacity: 0 }} 
                 animate={{ opacity: 1 }} 
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 bg-background/80 backdrop-blur-md"
                 onClick={() => setShowRevealModal(false)}
               />
               <motion.div 
                 initial={{ opacity: 0, scale: 0.9, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 20 }}
                 className="relative w-full max-w-lg p-8 rounded-3xl bg-surface-elevated border border-border shadow-2xl overflow-hidden"
               >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary/50"></div>
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                           <AlertTriangle className="w-6 h-6 text-primary" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground lowercase tracking-tighter">Safeguarding Log Required</h3>
                     </div>
                     <button onClick={() => setShowRevealModal(false)} className="p-2 rounded-xl hover:bg-surface text-text-muted">
                        <X className="w-5 h-5" />
                     </button>
                  </div>

                  <p className="text-sm text-text-secondary mb-8 leading-relaxed font-medium">
                     Revealing a student's identity is an audited action. Please provide a brief justification for this reveal as per Lumina's safeguarding protocols.
                  </p>

                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Reveal Justification</label>
                        <textarea 
                           className="w-full h-32 p-5 rounded-2xl bg-surface border border-border text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-all font-medium resize-none shadow-inner text-sm"
                           placeholder="e.g., Escalation to senior safeguarding lead due to high-risk sentiment markers..."
                           value={revealJustification}
                           onChange={(e) => setRevealJustification(e.target.value)}
                        ></textarea>
                     </div>
                     
                     <div className="flex items-center gap-3">
                        <button 
                           onClick={() => setShowRevealModal(false)}
                           className="flex-1 py-4 rounded-2xl bg-surface text-xs font-bold text-text-muted hover:text-foreground transition-all uppercase tracking-widest"
                        >
                           Cancel
                        </button>
                        <button 
                           onClick={handleRevealIdentity}
                           disabled={!revealJustification}
                           className="flex-1 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-xs hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:scale-100 uppercase tracking-widest"
                        >
                           Log & Reveal
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
