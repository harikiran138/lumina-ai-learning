"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  MessageSquare, 
  Search, 
  Star, 
  Trash2, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile, 
  ShieldCheck,
  Circle,
  ChevronLeft,
  User,
  Hash
} from "lucide-react"
import { RealAPI } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function ParentMessagesPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")

  const api = RealAPI.getInstance()

  useEffect(() => {
    async function fetchData() {
      try {
        const dashboard = await api.getParentDashboard()
        setData(dashboard)
        if (dashboard?.messages?.length > 0) {
          setSelectedChat(dashboard.messages[0].id)
        }
      } catch (err) {
        console.error("Failed to load messages", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const messages = data?.messages || []
  const activeChat = messages.find((m: any) => m.id === selectedChat) || messages[0]

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col pt-4">
      <div className="mx-auto w-full max-w-[1600px] h-full flex overflow-hidden border border-white/5 rounded-t-[2.5rem] bg-white/[0.02] backdrop-blur-3xl">
        {/* Sidebar */}
        <div className="w-full max-w-[400px] border-r border-white/5 flex flex-col">
          <div className="p-8">
            <h1 className="text-3xl font-black mb-6 tracking-tight">Messages</h1>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search conversations..." 
                className="bg-white/5 border-white/10 pl-11 h-12 rounded-2xl focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-8">
            {messages.map((chat: any) => (
              <motion.div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`p-4 rounded-[1.5rem] cursor-pointer transition-all flex gap-4 border ${
                  selectedChat === chat.id 
                    ? "bg-purple-600/10 border-purple-500/30 ring-1 ring-purple-500/20" 
                    : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl font-bold border border-white/10">
                    {chat.from[0]}
                  </div>
                  {chat.unread && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-blue-500 rounded-full border-4 border-slate-900 shadow-lg"></div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-lg truncate">{chat.from}</h3>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{chat.timestamp || "2h"}</span>
                  </div>
                  <p className={`text-sm truncate ${chat.unread ? "text-gray-200 font-medium" : "text-gray-500"}`}>
                    {chat.preview}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col relative bg-slate-950/20">
          {activeChat ? (
            <>
              {/* Top Bar */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-xl bg-slate-900/40 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-lg border border-white/10">
                     {activeChat.from[0]}
                   </div>
                   <div>
                     <h2 className="font-bold text-xl">{activeChat.from}</h2>
                     <div className="flex items-center gap-2 text-xs text-green-500">
                        <Circle className="h-2 w-2 fill-green-500" />
                        Online
                     </div>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white rounded-xl h-12 w-12">
                     <ShieldCheck className="h-5 w-5" />
                   </Button>
                   <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white rounded-xl h-12 w-12">
                     <Star className={`h-5 w-5 ${activeChat.starred ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                   </Button>
                   <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white rounded-xl h-12 w-12">
                     <MoreVertical className="h-5 w-5" />
                   </Button>
                </div>
              </div>

              {/* Chat Content Simulation */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
                 <div className="flex flex-col items-center mb-8">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-gray-500 px-4 py-1">Today</Badge>
                 </div>

                 {/* Mock messages for the mock chat */}
                 <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center font-bold shrink-0 mt-1">{activeChat.from[0]}</div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-3xl rounded-tl-none max-w-[70%]">
                       <p className="text-sm leading-relaxed">{activeChat.preview}</p>
                       <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase">{activeChat.timestamp}</p>
                    </div>
                 </div>

                 <div className="flex gap-4 flex-row-reverse">
                    <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center font-bold shrink-0 mt-1">P</div>
                    <div className="bg-purple-600 text-white p-4 rounded-3xl rounded-tr-none max-w-[70%] shadow-lg shadow-purple-500/10">
                       <p className="text-sm leading-relaxed">Thank you for the update. I'll make sure they complete the final assignment by Friday.</p>
                       <p className="text-[10px] text-purple-200 mt-2 font-bold uppercase text-right">Just Now</p>
                    </div>
                 </div>
              </div>

              {/* Input Area */}
              <div className="p-8 border-t border-white/5 bg-slate-900/40 backdrop-blur-xl">
                 <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-end gap-3 bg-white/5 border border-white/10 p-3 rounded-[2rem] focus-within:border-purple-500/40 transition-all">
                       <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-gray-500 hover:text-white shrink-0">
                          <Paperclip className="h-5 w-5" />
                       </Button>
                       <textarea 
                          className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-sm resize-none min-h-[48px] max-h-32 text-white placeholder-gray-500"
                          placeholder="Type your message securely..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                       />
                       <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full text-gray-500 hover:text-white shrink-0">
                          <Smile className="h-5 w-5" />
                       </Button>
                       <Button 
                        size="icon" 
                        className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 hover:scale-105 transition-transform shrink-0 shadow-lg shadow-purple-500/20"
                       >
                          <Send className="h-5 w-5" />
                       </Button>
                    </div>
                 </div>
                 <p className="mt-4 text-[10px] text-gray-600 flex items-center justify-center gap-2 font-bold tracking-widest uppercase">
                    <ShieldCheck className="h-3 w-3" />
                    End-to-End Encrypted via Lumina Secure
                 </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/[0.01]">
               <div className="h-24 w-24 bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-8 border border-white/5">
                  <Hash className="h-10 w-10 text-gray-600" />
               </div>
               <h2 className="text-2xl font-bold mb-4">Secure Messaging</h2>
               <p className="text-gray-500 max-w-sm mx-auto">
                 Select a conversation from the list to view your encrypted communications with teachers and mentors.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
