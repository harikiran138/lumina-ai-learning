"use client";

import { useEffect, useState } from "react";
import { 
  Terminal, 
  Code2, 
  History, 
  Play, 
  Save,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Prompt {
  id: string;
  name: string;
  version: string;
  active: boolean;
  content?: string;
}

export default function PromptManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/ai/prompts");
        const data = await res.json();
        setPrompts(data);
        if (data.length > 0) setSelectedPrompt(data[0]);
      } catch (err) {
        console.error("failed_to_load_prompts", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-amber-400" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Terminal className="h-8 w-8 text-amber-500" />
            Prompt Management
          </h1>
          <p className="mt-1 text-gray-400">Manage, version, and test system instructions for Lumina AI.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-500 transition-colors">
            <Save className="h-4 w-4" />
            Deploy Prompt
          </button>
        </div>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 glass-v2 border-white/5 flex flex-col shrink-0">
          <div className="p-4 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search prompts..." 
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {prompts.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPrompt(p)}
                className={cn(
                  "w-full text-left p-4 rounded-xl transition-all group",
                  selectedPrompt?.id === p.id 
                    ? "bg-amber-600/10 border border-amber-500/20" 
                    : "hover:bg-white/[0.05] border border-transparent"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-bold",
                    selectedPrompt?.id === p.id ? "text-amber-400" : "text-white"
                  )}>{p.name}</span>
                  <span className="text-[10px] p-0.5 rounded bg-white/5 text-gray-500 font-mono">v{p.version}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">ID: {p.id}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 glass-v2 border-white/5 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-bold text-white">{selectedPrompt?.name}</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-yellow-400">
                <CheckCircle2 className="h-3.3 w-3.3" />
                Active on Production
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 text-gray-400 hover:text-white transition-colors">
                <History className="h-4 w-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-600/10 text-yellow-400 text-xs font-bold border border-yellow-500/20 hover:bg-yellow-600/20 transition-all">
                <Play className="h-3 w-3 fill-current" />
                Test in Sandbox
              </button>
            </div>
          </div>
          <div className="flex-1 p-0 relative">
            <textarea
              className="w-full h-full p-8 bg-transparent text-gray-300 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              defaultValue={`You are Lumina, a high-precision AI tutor.
Your goal is to guide the student through complex reasoning steps without giving away the direct answer.

## Instructions
- Always use Socratic questioning.
- Maintain a supportive but academic tone.
- Flag any PII or inappropriate content to the Guardian agent.`}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-gray-500 font-mono">
              <span>UTF-8</span>
              <div className="h-2 w-px bg-white/20" />
              <span>Markdown Supported</span>
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
        <AlertCircle className="h-4 w-4 text-amber-500" />
        <p className="text-xs text-gray-500">
          <span className="font-bold text-gray-400 uppercase mr-2 tracking-widest">Version Control:</span> 
          All changes are tracked in the <code className="text-amber-400">system_prompts</code> table with a signature of the approving administrator.
        </p>
      </div>
    </div>
  );
}
