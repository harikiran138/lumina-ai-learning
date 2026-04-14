"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  UploadCloud, 
  FileJson, 
  CheckCircle2, 
  Clock, 
  Layers, 
  BookOpen, 
  BarChart, 
  Edit3, 
  Trash2,
  ChevronRight,
  Zap,
  Cpu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={cn(
      'rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-2xl shadow-premium overflow-hidden',
      className
    )}
  >
    {children}
  </motion.div>
);

export default function ContentCreatorDashboard() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Content creator specific data
    const fetchData = async () => {
      try {
        // Mocked or derived from existing stores
        const data = await api.getCreatorVerificationQueue();
        setUploads(data);
      } catch (err) {
        console.error("Error fetching content creator data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Content <span className="gradient-text">Studio</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Architecting the adaptive knowledge graph</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-lumina-highlight text-black rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            <Plus className="w-4 h-4 mr-2" />
            New Course Blueprint
          </Button>
          <Button variant="outline" className="glass-v2 border-white/10 text-white rounded-xl font-bold hover:border-lumina-highlight/30">
            <UploadCloud className="w-4 h-4 mr-2 text-lumina-highlight" />
            Bulk Upload
          </Button>
        </div>
      </div>

      {/* Workflow Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Books Digitized', value: '1,248', icon: BookOpen, color: 'lumina-highlight' },
          { label: 'Scaffolds Pending', value: '42', icon: Clock, color: 'lumina-highlight' },
          { label: 'Graph Nodes', value: '8,402', icon: Layers, color: 'lumina-highlight' },
          { label: 'AI QA Coverage', value: '94%', icon: Cpu, color: 'green' }
        ].map((stat, idx) => (
          <GlassCard key={idx} className="p-6">
             <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</span>
                <stat.icon className={cn("w-5 h-5", stat.color === 'lumina-highlight' ? "text-lumina-highlight" : `text-${stat.color}-400`)} />
             </div>
             <div className="text-3xl font-bold text-white">{stat.value}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Queue (V2.0 Core) */}
        <GlassCard className="lg:col-span-2 p-8 border-lumina-highlight/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-lumina-highlight/10">
                <Zap className="w-6 h-6 text-lumina-highlight" />
              </div>
              <h2 className="text-2xl font-bold text-white">Verification Queue</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-white/10 text-gray-400">FILTER BY: AI CONFIDENCE</Badge>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumina-highlight"></div>
              </div>
            ) : uploads.length > 0 ? (
              uploads.map((item) => (
                <div key={item.id} className="p-5 rounded-2xl glass-v2 border-white/5 hover:border-lumina-highlight/20 transition-all group">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-lumina-highlight/10 flex items-center justify-center">
                            <FileJson className="w-5 h-5 text-lumina-highlight" />
                         </div>
                         <div>
                            <h4 className="font-bold text-white truncate max-w-xs">{item.original_filename || "Mastering Physics V2.pdf"}</h4>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Uploaded 4h ago</p>
                         </div>
                      </div>
                      <Badge className="bg-lumina-highlight text-black font-bold uppercase tracking-widest text-[9px]">AI GENERATED SCAFFOLD</Badge>
                   </div>
                   
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10 text-xs font-bold">
                        Inspect Graph
                      </Button>
                      <Button size="sm" className="flex-1 bg-lumina-highlight hover:bg-lumina-highlight/80 text-black font-bold text-xs uppercase tracking-widest px-6 active:scale-95 transition-all">
                        Approve & Deploy
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
              ))
            ) : (
              <div className="p-20 flex flex-col items-center justify-center text-center opacity-50">
                 <Cpu className="w-12 h-12 mb-4" />
                 <p className="font-bold text-white">No pending scaffolds</p>
                 <p className="text-sm text-gray-500 mt-1">Start by uploading a source document</p>
              </div>
            )}
          </div>
        </GlassCard>

        {/* Content Insights */}
        <div className="space-y-8">
          <GlassCard className="p-8">
             <h3 className="text-xl font-bold text-white mb-6">Course Coverage</h3>
             <div className="space-y-6">
                {[
                  { label: 'Mathematics', value: 92, status: 'complete' },
                  { label: 'Computer Science', value: 78, status: 'expanding' },
                  { label: 'Physics', value: 45, status: 'urgent' },
                  { label: 'Architecture', value: 12, status: 'seed' }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-2">
                       <span className="text-gray-400 font-bold">{item.label}</span>
                       <span className="text-white font-bold">{item.value}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className={cn(
                           "h-full rounded-full",
                           item.value > 80 ? "bg-green-500" : item.value > 40 ? "bg-lumina-highlight" : "bg-red-500"
                         )} 
                         style={{ width: `${item.value}%` }} 
                       />
                    </div>
                  </div>
                ))}
             </div>
          </GlassCard>

          <GlassCard className="p-8 bg-gradient-to-br from-lumina-highlight/10 to-transparent">
             <div className="flex items-center gap-3 mb-4">
                <UploadCloud className="w-6 h-6 text-lumina-highlight" />
                <h3 className="font-bold text-white uppercase tracking-widest text-xs">AI Copilot</h3>
             </div>
             <p className="text-sm text-gray-400 leading-relaxed mb-6">
                "I've detected a logic gap in the **Quantum Mechanics** scaffold. Would you like me to auto-generate the prerequisite nodes?"
             </p>
             <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-widest">
                Review Proposal
             </button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
