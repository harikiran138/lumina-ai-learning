"use client";

import React, { useState, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { 
  Plus, 
  Layers, 
  Settings, 
  Play, 
  GripVertical, 
  Trash2, 
  Save, 
  Eye, 
  Rocket, 
  ChevronRight,
  BookOpen,
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  Info
} from 'lucide-react';
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

export default function CourseBuilder() {
  const [items, setItems] = useState([
    { id: '1', title: 'Introduction to Neural Architecture', type: 'video', duration: '5m' },
    { id: '2', title: 'The Concept of Backpropagation', type: 'explainer', duration: '10m' },
    { id: '3', title: 'Interactive Weights Simulation', type: 'lab', duration: '15m' },
    { id: '4', title: 'Module Assessment: Gradients', type: 'quiz', duration: '5m' }
  ]);

  const [activeTab, setActiveTab] = useState<'blueprint' | 'settings'>('blueprint');

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Layers className="w-8 h-8 text-indigo-400" />
           </div>
           <div>
              <h1 className="text-3xl font-display font-bold text-white tracking-tight lowercase">
                Course <span className="gradient-text">Architect</span>
              </h1>
              <p className="text-gray-400 mt-1 font-medium italic text-xs uppercase tracking-widest">Blueprint: Deep Learning Foundations v2.4</p>
           </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-primary text-black font-bold text-sm hover:scale-105 transition-all shadow-gold-glow">
            <Rocket className="w-4 h-4" /> Publish Sequence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
           <GlassCard className="p-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Lesson Toolbox</h3>
              <div className="space-y-4">
                 {[
                   { icon: Play, label: 'Video Lecture', color: 'text-indigo-400' },
                   { icon: BookOpen, label: 'Written Explainer', color: 'text-teal-400' },
                   { icon: Sparkles, label: 'AI Interactive Lab', color: 'text-amber-400' },
                   { icon: MessageSquare, label: 'Problem Set', color: 'text-rose-400' }
                 ].map((tool, i) => (
                   <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/20 transition-all cursor-grab group">
                      <div className="flex items-center gap-3">
                         <tool.icon className={cn("w-5 h-5", tool.color)} />
                         <span className="text-xs font-bold text-white uppercase tracking-tighter">{tool.label}</span>
                      </div>
                      <Plus className="w-4 h-4 text-gray-700 group-hover:text-white transition-colors" />
                   </div>
                 ))}
              </div>
              <div className="mt-10 p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 italic text-[10px] text-gray-500 font-medium leading-relaxed">
                 <Info className="w-4 h-4 text-indigo-400 mb-2" />
                 Lumina AI can auto-generate question banks based on your lesson content. Toggle 'AI Verification' in settings.
              </div>
           </GlassCard>
        </div>

        <div className="lg:col-span-3 space-y-8">
           <div className="flex items-center gap-4 border-b border-white/5 pb-2 mb-6">
              <button className="text-sm font-bold text-lumina-primary relative after:absolute after:-bottom-2 after:left-0 after:right-0 after:h-0.5 after:bg-lumina-primary uppercase tracking-widest">Sequence Editor</button>
              <button className="text-sm font-bold text-gray-600 hover:text-gray-400 uppercase tracking-widest">Objective Mapping</button>
           </div>

           <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-4">
              {items.map((item) => (
                <Reorder.Item key={item.id} value={item}>
                   <GlassCard className="p-6 group hover:border-indigo-500/30 transition-all flex items-center gap-6">
                      <div className="cursor-grab active:cursor-grabbing text-gray-700 hover:text-white transition-colors">
                         <GripVertical className="w-5 h-5" />
                      </div>
                      
                      <div className={cn(
                        "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0",
                        item.type === 'video' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                        item.type === 'explainer' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      )}>
                         {item.type === 'video' ? <Play className="w-5 h-5" /> : 
                          item.type === 'quiz' ? <MessageSquare className="w-5 h-5" /> : 
                          <BookOpen className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                         <h4 className="text-lg font-bold text-white lowercase tracking-tighter mb-1 truncate">{item.title}</h4>
                         <div className="flex items-center gap-4">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.type}</span>
                            <span className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">•</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{item.duration} Read</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-white transition-all">
                            <Settings className="w-4 h-4" />
                         </button>
                         <button className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-600 hover:text-rose-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </GlassCard>
                </Reorder.Item>
              ))}
           </Reorder.Group>

           <button className="w-full py-6 rounded-3xl border-2 border-dashed border-white/5 text-gray-600 hover:text-indigo-400 hover:border-indigo-500/20 transition-all font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3">
              <Plus className="w-5 h-5" /> Add Lesson Module
           </button>
        </div>
      </div>
    </div>
  );
}
