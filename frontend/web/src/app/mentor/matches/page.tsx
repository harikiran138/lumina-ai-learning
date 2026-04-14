"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Target, 
  ChevronRight, 
  Search, 
  Filter,
  Star,
  MessageCircle,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function MentorMatches() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const m = await api.getMentorMatches();
        setMatches(m);
      } catch (err) {
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredMatches = matches.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.skills && m.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Mentee <span className="gradient-text">Matches</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Discover students who align with your expertise</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search by name or skill..."
              className="pl-10 pr-4 py-2.5 rounded-xl glass-v2 border-white/10 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-lumina-primary/50 w-64 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 rounded-xl glass-v2 border-white/10 text-gray-400 hover:text-white transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-80 rounded-3xl bg-white/5 animate-pulse"></div>
          ))
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((mentee) => (
            <GlassCard key={mentee.id} className="p-6 hover:border-white/10 transition-all group">
               <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <img 
                      src={mentee.avatar || `https://ui-avatars.com/api/?name=${mentee.name}&background=random`} 
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-white/10 group-hover:border-lumina-primary/30 transition-colors" 
                      alt={mentee.name} 
                    />
                    <div className="absolute -top-2 -right-2 px-2 py-1 rounded-lg bg-lumina-primary text-black text-[10px] font-bold shadow-gold-glow">
                      {mentee.alignmentScore || '96'}% MATCH
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                      <Star className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
               </div>

               <h3 className="text-xl font-bold text-white mb-2 group-hover:gradient-text transition-all">{mentee.name}</h3>
               <p className="text-xs text-gray-500 font-medium line-clamp-2 mb-4">
                 Seeking mentorship in Advanced {mentee.skills?.[0] || 'AI'} and system architecture.
               </p>

               <div className="flex flex-wrap gap-2 mb-6">
                  {(mentee.skills || ['React', 'TS', 'AI']).map((s: string) => (
                    <span key={s} className="px-2 py-1 rounded-lg bg-white/5 text-[10px] text-gray-400 font-bold border border-white/5">{s}</span>
                  ))}
               </div>

               <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Verified Learner</span>
                  </div>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-lumina-primary group-hover:gap-3 transition-all">
                    Initiate Connection <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full h-96 flex flex-col items-center justify-center text-center glass-v2 rounded-3xl border-dashed border-white/10">
            <Users className="w-16 h-16 text-gray-700 mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-gray-500">No matches found</h3>
            <p className="text-gray-600 text-sm max-w-xs mt-2 font-medium">Try adjusting your search terms or wait for new students to join the alignment pool.</p>
          </div>
        )}
      </div>
    </div>
  );
}
