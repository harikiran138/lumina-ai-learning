"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Search, 
  Send, 
  MoreVertical, 
  User, 
  Paperclip, 
  Smile, 
  Phone, 
  Video,
  Info,
  CheckCheck,
  Zap,
  Sparkles,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Chat {
  id: string;
  name: string;
  student: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
}

export default function parentMessagingPage() {
  const [selectedId, setSelectedId] = useState("c1");
  const [message, setMessage] = useState("");

  const chats: Chat[] = [
    { id: "c1", name: "Mei Chen", student: "Alice Chen", lastMessage: "Thank you for the update on her progress!", time: "2:14 PM", unread: 0, online: true },
    { id: "c2", name: "Robert Kim", student: "David Kim", lastMessage: "Is there a meeting this Friday?", time: "昨天", unread: 2, online: false },
    { id: "c3", name: "Sarah Smith", student: "Bob Smith", lastMessage: "I'll make sure he finishes the assignment.", time: "2 days ago", unread: 0, online: true },
  ];

  return (
    <div className="min-h-screen p-8 flex flex-col">
       <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">Parent Portal</h1>
          <p className="mt-2 text-gray-400">Direct communication with guardians. Synced with student performance alerts.</p>
        </div>
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
           <div className="text-right">
             <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Response Rate</p>
             <p className="text-xl font-display font-bold text-yellow-400">98%</p>
           </div>
           <div className="h-10 w-px bg-white/10" />
           <div className="text-right">
             <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Avg. Response Time</p>
             <p className="text-xl font-display font-bold text-amber-400">14m</p>
           </div>
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[380px_1fr] gap-8 overflow-hidden max-h-[700px]">
        <aside className="glass-v2 border-white/5 rounded-3xl flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/5 space-y-4">
             <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search parents..."
                className="w-full rounded-xl bg-white/5 border border-white/10 py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedId(chat.id)}
                className={cn(
                  "p-4 rounded-2xl cursor-pointer transition-all border flex items-center gap-4 group",
                  selectedId === chat.id ? "bg-amber-400/10 border-amber-400/30" : "bg-white/[0.02] border-white/5 hover:border-white/10"
                )}
              >
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-bold text-white uppercase italic">
                    {chat.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-yellow-500 border-2 border-black" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-bold text-white text-sm truncate uppercase tracking-tight">{chat.name}</p>
                    <span className="text-[10px] text-gray-600 font-bold">{chat.time}</span>
                  </div>
                  <p className="text-[11px] text-amber-500 font-bold uppercase mb-1 tracking-widest">Parent of {chat.student}</p>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
                {chat.unread > 0 && (
                  <div className="h-5 w-5 rounded-full bg-amber-400 flex items-center justify-center text-[10px] font-bold text-black">
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </aside>

        <main className="glass-v2 border-white/5 rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-gray-500 font-bold text-xs uppercase italic">
                 {chats.find(c => c.id === selectedId)?.name.split(' ').map(n => n[0]).join('')}
               </div>
               <div>
                 <p className="text-sm font-bold text-white uppercase tracking-tight">{chats.find(c => c.id === selectedId)?.name}</p>
                 <p className="text-[10px] text-gray-600 font-bold uppercase flex items-center gap-2">
                   {chats.find(c => c.id === selectedId)?.online ? "Active Now" : "Seen 2h ago"}
                   <div className={cn("h-1.5 w-1.5 rounded-full", chats.find(c => c.id === selectedId)?.online ? "bg-yellow-500" : "bg-gray-700")} />
                 </p>
               </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                <Phone className="h-4 w-4" />
              </button>
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                <Video className="h-4 w-4" />
              </button>
              <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 rounded-full bg-white/5 text-[10px] font-bold text-gray-600 uppercase tracking-widest border border-white/10">Today</span>
            </div>

            <div className="flex justify-end">
              <div className="max-w-[70%] space-y-2">
                <div className="p-4 rounded-3xl rounded-tr-sm bg-amber-400 text-black text-sm font-medium leading-relaxed shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                  Hi Mei, I've noticed Alice is struggling a bit with the new Asynchronous JS module. I've assigned a personalized interactive lab for her to help clarify the concepts.
                </div>
                <div className="flex items-center justify-end gap-1.5 text-[10px] text-gray-600 font-bold uppercase">
                  1:45 PM <CheckCheck className="h-3 w-3 text-amber-400" />
                </div>
              </div>
            </div>

            <div className="flex justify-start">
              <div className="max-w-[70%] space-y-2">
                <div className="p-4 rounded-3xl rounded-tl-sm bg-white/5 border border-white/10 text-white text-sm font-medium leading-relaxed">
                  Thank you for the update on her progress! We'll make sure she spends some time on the lab this evening. She mentioned she was confused about the event loop.
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold uppercase">
                  2:14 PM
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start">
               <Sparkles className="h-5 w-5 text-amber-400 shrink-0 mt-1" />
               <div className="space-y-2">
                 <p className="text-sm font-bold text-amber-100 uppercase tracking-wider">AI Suggestion</p>
                 <p className="text-xs text-amber-200/60 leading-relaxed italic">
                   "You're welcome! If she needs more help, there's a live tutoring session tomorrow at 4 PM. Would you like me to reserve a spot for her?"
                 </p>
                 <button className="text-xs font-bold text-amber-400 hover:text-white transition-colors">Apply context aware response</button>
               </div>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 pl-4 pr-2">
              <button className="p-2 text-gray-500 hover:text-white transition-all">
                <Smile className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-500 hover:text-white transition-all">
                <Paperclip className="h-5 w-5" />
              </button>
              <input 
                type="text"
                placeholder="Message Mei Chen..."
                className="flex-1 bg-transparent py-2 text-sm text-white focus:outline-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button className="h-10 w-10 rounded-xl bg-amber-400 flex items-center justify-center text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
