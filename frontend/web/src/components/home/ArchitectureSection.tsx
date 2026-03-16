"use client";

import { Server, Database, Brain, Globe, Shield, Code2 } from "lucide-react";

const techStack = [
  { name: "Next.js 15", category: "Frontend", description: "React 19, Server Components" },
  { name: "FastAPI", category: "Backend", description: "High-performance Python API" },
  { name: "PostgreSQL", category: "Database", description: "Relational data & RLS policies" },
  { name: "Neo4j", category: "Graph DB", description: "Knowledge graph engine" },
  { name: "Redis", category: "Caching", description: "Real-time state & pub/sub" },
  { name: "MinIO", category: "Storage", description: "S3-compatible object storage" }
];

export default function ArchitectureSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Platform Architecture
          </h2>
          <p className="text-lg text-gray-400">
            A modular, scalable microservices architecture designed for high-availability and extreme performance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="glass-panel p-8 lg:p-12 rounded-3xl border border-white/5 bg-surface-950/50">
             <div className="relative space-y-12">
                {/* Visual Architecture Representation */}
                <div className="flex items-center justify-between relative">
                   <div className="z-10 w-20 h-20 rounded-2xl bg-lumina-primary/20 border border-lumina-primary/30 flex items-center justify-center shadow-gold-glow">
                      <Globe className="h-10 w-10 text-lumina-primary" />
                   </div>
                   <div className="absolute top-1/2 left-20 right-20 h-0.5 bg-gradient-to-r from-lumina-primary/20 via-white/10 to-blue-500/20 -translate-y-1/2 hidden sm:block" />
                   <div className="z-10 w-20 h-20 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                      <Server className="h-10 w-10 text-blue-400" />
                   </div>
                   <div className="absolute top-1/2 left-20 right-20 h-0.5 bg-gradient-to-r from-blue-500/20 via-white/10 to-green-500/20 -translate-y-1/2 hidden sm:block rotate-180" />
                </div>
                
                <div className="grid grid-cols-2 gap-6 pt-8">
                   <div className="glass-card p-6 border-white/5">
                      <Database className="h-6 w-6 text-gray-400 mb-4" />
                      <h4 className="text-white font-bold mb-2">Data Persistence</h4>
                      <p className="text-xs text-gray-500">PostgreSQL + Supabase Auth</p>
                   </div>
                   <div className="glass-card p-6 border-white/5">
                      <Brain className="h-6 w-6 text-lumina-primary mb-4" />
                      <h4 className="text-white font-bold mb-2">ML Engine</h4>
                      <p className="text-xs text-gray-500">Vector Search + Graph RAG</p>
                   </div>
                </div>
                
                <div className="flex justify-center pt-4">
                   <div className="animate-pulse-orb w-32 h-32 bg-lumina-primary/10 rounded-full blur-3xl absolute -z-10" />
                   <div className="glass-button-secondary py-2 px-6 rounded-full text-xs font-mono uppercase tracking-widest flex items-center">
                      <Code2 className="h-4 w-4 mr-2" /> Microservices Grid
                   </div>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             {techStack.map((tech, index) => (
               <div key={index} className="glass-v2 p-6 flex flex-col justify-center border-white/5 hover:border-white/10 transition-colors">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{tech.category}</div>
                  <div className="text-lg font-bold text-white mb-2">{tech.name}</div>
                  <div className="text-sm text-gray-400 leading-relaxed">{tech.description}</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </section>
  );
}
