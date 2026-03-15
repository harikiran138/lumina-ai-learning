"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  Target, 
  Award,
  BookOpen,
  Bell,
  Search,
  Eye,
  EyeOff,
  Send,
  Star,
  ChevronRight,
  Activity,
  Calendar,
  Filter,
  MoreVertical,
  X
} from "lucide-react"
import { RealAPI } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Types based on backend and previous generation
interface Child {
  id: string
  name: string
  avatarUrl: string
  masteryPercentage: number
  verified: boolean
  grade: string
  accentColor: string
}

interface RecentActivity {
  id: string
  childId: string
  childName: string
  type: "assignment" | "lesson"
  title: string
  timestamp: string
  score?: number
}

interface Goal {
  id: string
  childId: string
  childName: string
  title: string
  progress: number
  targetDate: string
  status: "on-track" | "at-risk" | "completed"
}

interface Message {
  id: string
  from: string
  avatarUrl: string
  preview: string
  timestamp: string
  unread: boolean
  starred: boolean
}

export default function ParentDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showBalance, setShowBalance] = useState(true)
  const [messagesPanelOpen, setMessagesPanelOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "on-track" | "at-risk" | "completed">("all")

  const api = RealAPI.getInstance()

  useEffect(() => {
    async function loadDashboard() {
      try {
        const dashboardData = await api.getParentDashboard()
        if (dashboardData) {
          // Adapt backend data to frontend needs if necessary
          // For now, using mock-like structure derived from RealAPI response
          setData(dashboardData)
        }
      } catch (err) {
        console.error("Failed to load parent dashboard", err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Fallback to empty structure if data is null
  const dashboardData = data || { children: [], recent_activities: [], goals: [], messages: [] }

  const unreadCount = (dashboardData.messages || []).filter((m: any) => m.unread).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white pb-12">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                    Lumina Parent
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-purple-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMessagesPanelOpen(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                <div className="h-9 w-9 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center text-purple-400 font-bold">
                  P
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome & Stats */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back!</h2>
            <p className="text-gray-400">Monitor your children's learning growth and stay connected.</p>
          </div>

          {/* Children Overview */}
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                Your Children
              </h3>
              <Button variant="link" className="text-purple-400 text-sm p-0">Manage Verification</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(dashboardData.children || []).map((child: any, idx: number) => (
                <motion.div
                  key={child.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="bg-white/5 border-white/10 backdrop-blur-md overflow-hidden hover:border-purple-500/30 transition-all p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-xl font-bold">
                          {child.name[0]}
                        </div>
                        {child.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-0.5 border-2 border-slate-900">
                            <CheckCircle className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{child.name}</h4>
                        <p className="text-sm text-gray-500">Student ID: ...{child.id.slice(-4)}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                          <span>Overall Mastery</span>
                          <span className="text-white font-medium">{child.mastery || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${child.mastery || 0}%` }}
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10">
                          View Activity
                        </Button>
                        <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                          Set Goal
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              
              {(!dashboardData.children || dashboardData.children.length === 0) && (
                <Card className="bg-white/5 border-dashed border-white/10 p-8 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-gray-500" />
                  </div>
                  <h4 className="font-semibold text-white">No children linked</h4>
                  <p className="text-sm text-gray-500 mt-1 max-w-[200px]">Link your children via their unique ID to monitor progress.</p>
                  <Button variant="link" className="text-purple-400 mt-2">Link Account</Button>
                </Card>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Primary Content (Activities) */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    Recent Activity
                  </h3>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input 
                        className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 w-48"
                        placeholder="Search..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {(dashboardData.recent_activities || []).map((activity: any, idx: number) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between hover:bg-white/[0.07] transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            {activity.type === 'assignment' ? <Target className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-white">{activity.title}</h5>
                            <p className="text-xs text-gray-500">{activity.child_name || 'Student'} • {new Date(activity.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">{activity.status || 'Completed'}</div>
                          <p className="text-[10px] text-gray-500">2 hours ago</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {(!dashboardData.recent_activities || dashboardData.recent_activities.length === 0) && (
                    <div className="bg-white/5 border border-dashed border-white/10 p-12 rounded-xl text-center">
                      <Clock className="h-8 w-8 text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-500">No recent activity detected.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Sidebar Content (Goals & Messages) */}
            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-400" />
                    Goals
                  </h3>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">+</Button>
                </div>

                <div className="space-y-4">
                  {(dashboardData.goals || []).map((goal: any) => (
                    <div key={goal.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex justify-between mb-3">
                        <h6 className="text-sm font-semibold text-white">{goal.title}</h6>
                        <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">
                          ON TRACK
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-500">
                          <span>{goal.child_name}</span>
                          <span>Due March 12</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {(!dashboardData.goals || dashboardData.goals.length === 0) && (
                    <div className="bg-white/5 border border-white/10 p-6 rounded-xl text-center text-sm text-gray-500">
                      No active goals. Set a goal to help your children stay focused.
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-400" />
                    Messages
                  </h3>
                  {unreadCount > 0 && <Badge className="bg-purple-500">{unreadCount}</Badge>}
                </div>

                <div className="space-y-3">
                  {(dashboardData.messages || []).slice(0, 3).map((msg: any) => (
                    <div key={msg.id} className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-sm font-bold">
                        {msg.from[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <h6 className="text-sm font-bold text-white truncate">{msg.from}</h6>
                          <span className="text-[10px] text-gray-500">2h</span>
                        </div>
                        <p className="text-xs text-gray-400 truncate">{msg.preview}</p>
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" fullWidth className="text-gray-500 text-xs mt-2">View All Messages</Button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Slide-over Messages Panel */}
      <AnimatePresence>
        {messagesPanelOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessagesPanelOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/10 z-50 flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Inbox</h3>
                <Button variant="ghost" size="icon" onClick={() => setMessagesPanelOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {(dashboardData.messages || []).map((msg: any) => (
                  <div key={msg.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/20 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-sm font-bold text-white">{msg.from}</span>
                       <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-400">{msg.preview}</p>
                    <div className="mt-3 flex gap-2">
                       {msg.unread && <Badge className="bg-blue-500/20 text-blue-400 border-none h-5 px-1.5 text-[10px]">NEW</Badge>}
                       {msg.starred && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-6 border-t border-white/10">
                <Button fullWidth className="bg-purple-600 hover:bg-purple-700">New Conversation</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
