"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Search, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Star,
  MessageSquare,
  ExternalLink,
  History,
  Send,
  X,
  Plus
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

export default function MentorReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);

  useEffect(() => {
    // Mocking review queue for now as no direct "getQueue" method exists beyond dashboard snippets
    const timer = setTimeout(() => {
      setReviews([
        { id: '1', menteeId: 'm1', menteeName: 'Sarah Chen', title: 'AI Ethics Final Project', status: 'pending', submittedAt: '2 hours ago', type: 'Paper' },
        { id: '2', menteeId: 'm2', menteeName: 'Marcus Johnson', title: 'Neural Network Visualization', status: 'pending', submittedAt: '5 hours ago', type: 'Code' },
        { id: '3', menteeId: 'm3', menteeName: 'Priya Patel', title: 'Data Pipeline Optimization', status: 'completed', submittedAt: '1 day ago', type: 'Design' }
      ]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmitReview = async () => {
    if (!selectedReview || !feedback || rating === 0) return;
    
    try {
      await api.submitPortfolioReview({
        mentee_id: selectedReview.menteeId,
        portfolio_snapshot: { title: selectedReview.title },
        feedback: feedback,
        rating: rating
      });
      // Update local state
      setReviews(prev => prev.map(r => r.id === selectedReview.id ? { ...r, status: 'completed' } : r));
      setSelectedReview(null);
      setFeedback("");
      setRating(0);
    } catch (err) {
      console.error("Error submitting review:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Review <span className="gradient-text">Queue</span>
          </h1>
          <p className="text-text-muted mt-1 font-medium italic">Validate and provide guidance on mentee portfolios</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-foreground transition-colors uppercase tracking-widest">
            <History className="w-4 h-4" /> View History
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List of Reviews */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input 
              type="text"
              placeholder="Search submissions..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl glass-v2 border-border text-sm text-foreground focus:outline-none focus:border-primary transition-all font-medium"
            />
          </div>

          {loading ? (
             [1, 2, 3].map(i => <div key={i} className="h-24 bg-surface rounded-3xl animate-pulse"></div>)
          ) : (
            reviews.map((review) => (
              <div 
                key={review.id}
                onClick={() => setSelectedReview(review)}
                className={cn(
                  "p-5 rounded-3xl border transition-all cursor-pointer group",
                  selectedReview?.id === review.id 
                    ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" 
                    : "bg-surface border-border hover:bg-surface-elevated"
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={cn(
                    "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                    review.status === 'pending' ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                  )}>
                    {review.status}
                  </span>
                  <span className="text-[10px] text-text-muted font-bold uppercase">{review.submittedAt}</span>
                </div>
                <h4 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors uppercase tracking-tighter leading-none mb-1">{review.title}</h4>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-text-muted font-medium">{review.menteeName}</p>
                  <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest bg-surface px-1.5 rounded-md">{review.type}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Review Workspace */}
        <div className="lg:col-span-2">
          {selectedReview ? (
            <GlassCard className="p-8 h-full flex flex-col">
              <div className="flex justify-between items-start mb-8 pb-8 border-b border-border">
                <div>
                   <h2 className="text-3xl font-bold text-foreground uppercase tracking-tighter mb-2">{selectedReview.title}</h2>
                   <div className="flex items-center gap-4">
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                          {selectedReview.menteeName[0]}
                        </div>
                        <span className="text-sm font-bold text-foreground">{selectedReview.menteeName}</span>
                     </div>
                     <span className="w-1 h-1 rounded-full bg-text-muted"></span>
                     <span className="text-xs text-text-muted font-medium">Submitted {selectedReview.submittedAt}</span>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedReview(null)}
                  className="p-2 rounded-xl bg-surface text-text-muted hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-8 min-h-[400px]">
                {/* Content Preview Mock */}
                 <div className="p-8 rounded-3xl bg-surface border border-border flex flex-col items-center justify-center text-center">
                   <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
                     <FileText className="w-8 h-8 text-text-muted" />
                   </div>
                   <h3 className="font-bold text-foreground mb-2 uppercase tracking-widest text-sm">Document Preview</h3>
                   <p className="text-xs text-text-muted font-medium mb-6">Full content analysis rendered by Lumina AI</p>
                   <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-foreground hover:bg-surface-elevated transition-all uppercase tracking-tighter font-display">
                     <ExternalLink className="w-4 h-4" /> Open Original Source
                   </button>
                </div>

                {/* Feedback Selection */}
                <div className="space-y-6">
                   <div>
                     <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Quality Rating</label>
                     <div className="flex gap-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className={cn(
                              "p-3 rounded-2xl border transition-all",
                              rating >= star ? "bg-warning/10 border-warning/30 text-warning" : "bg-surface border-border text-text-muted hover:text-text-secondary"
                            )}
                          >
                            <Star className={cn("w-6 h-6", rating >= star && "fill-current")} />
                          </button>
                        ))}
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Mentor Feedback</label>
                     <textarea 
                        className="w-full h-40 p-6 rounded-3xl bg-surface border border-border text-foreground placeholder:text-text-muted focus:outline-none focus:border-primary transition-all text-sm font-medium resize-none shadow-inner"
                        placeholder="Provide constructive insights, suggest improvements, or validate excellence..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                     ></textarea>
                   </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight">AI Content Validation Passed</p>
                 </div>
                 <button 
                    onClick={handleSubmitReview}
                    disabled={!feedback || rating === 0}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:scale-100"
                 >
                   Submit Validation <Send className="w-4 h-4 ml-1" />
                 </button>
              </div>
            </GlassCard>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-v2 rounded-3xl border-dashed border-border opacity-60">
               <div className="p-6 rounded-3xl bg-surface mb-6">
                 <MessageSquare className="w-12 h-12 text-text-muted" />
               </div>
               <h3 className="text-2xl font-bold text-text-secondary uppercase tracking-tighter">Workspace</h3>
               <p className="text-sm text-text-muted max-w-sm mt-2 font-medium italic">Select a mentee submission from the queue to begin providing expert guidance.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
