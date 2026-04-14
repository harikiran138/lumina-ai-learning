"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Target, 
  Calendar, 
  Plus, 
  ChevronRight, 
  Trophy, 
  Clock, 
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  X,
  User,
  Zap
} from "lucide-react"
import { RealAPI } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export default function ParentGoalsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newGoal, setNewGoal] = useState({ title: "", student_id: "", target_date: "" })

  const api = RealAPI.getInstance()

  useEffect(() => {
    async function fetchData() {
      try {
        const dashboard = await api.getParentDashboard()
        setData(dashboard)
      } catch (err) {
        console.error("Failed to load goals", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCreateGoal = async () => {
    if (!newGoal.title || !newGoal.student_id) return
    try {
      await api.setParentGoal(newGoal.student_id, "academic", newGoal.title, newGoal.target_date)
      setIsModalOpen(false)
      // Refresh
      const dashboard = await api.getParentDashboard()
      setData(dashboard)
    } catch (err) {
      console.error("Failed to create goal", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-lumina-highlight border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const goals = data?.goals || []
  const children = data?.children || []

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Academic Goals</h1>
            <p className="text-gray-400">Collaboratively set targets for your children's development.</p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-lumina-highlight hover:bg-lumina-highlight/80 text-black font-bold uppercase tracking-widest shadow-lg shadow-lumina-highlight/20 px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Goal
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence>
            {goals.map((goal: any, idx: number) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-white/5 border-white/10 p-6 hover:bg-white/[0.07] transition-all group">
                  <div className="flex flex-col md:flex-row gap-6 md:items-center">
                    <div className="h-14 w-14 rounded-2xl bg-lumina-highlight/10 flex items-center justify-center text-lumina-highlight shrink-0 border border-lumina-highlight/20">
                      <Target className="h-7 w-7" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold group-hover:text-lumina-highlight transition-colors">{goal.title}</h3>
                        <Badge className="bg-green-500/10 text-green-400 border-none">ACTIVE</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
                          <User className="h-3.5 w-3.5" />
                          {goal.child_name || "Assignee"}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-gray-300 transition-colors">
                          <Calendar className="h-3.5 w-3.5" />
                          Target: {new Date(goal.target_date || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                     <div className="w-full md:w-64 space-y-2">
                       <div className="flex justify-between text-xs font-medium mb-1.5">
                         <span className="text-gray-500">Current Progress</span>
                         <span className="text-lumina-highlight">45%</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                         <div className="h-full bg-lumina-highlight rounded-full w-[45%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-white hover:bg-white/10">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                      <Button variant="outline" size="sm" className="hidden md:flex border-white/10 hover:border-lumina-highlight/30 hover:bg-lumina-highlight/5 gap-2 text-[10px] font-bold uppercase tracking-widest transition-all">
                         Details
                         <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {goals.length === 0 && (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center">
              <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">No active goals found</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-8">
                Break down complex academic challenges into achievable milestones for your child.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-lumina-highlight hover:bg-lumina-highlight/80 text-black font-bold uppercase tracking-widest px-8">
                Set First Goal
              </Button>
            </div>
          )}
        </div>

        {/* Create Goal Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-md bg-neutral-900 border border-lumina-highlight/20 p-8 rounded-3xl shadow-2xl shadow-lumina-highlight/5"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white tracking-tight">New Academic Goal</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Goal Title</label>
                    <Input 
                       placeholder="e.g., Complete Algebra Mastery" 
                       className="bg-white/5 border-white/10 focus:ring-lumina-highlight h-12 rounded-xl"
                       value={newGoal.title}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({...newGoal, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Assign to Child</label>
                    <select 
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-lumina-highlight"
                      value={newGoal.student_id}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewGoal({...newGoal, student_id: e.target.value})}
                    >
                      <option value="" disabled className="bg-neutral-900 text-gray-400">Select Child</option>
                      {children.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-neutral-900 text-white">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest text-[10px]">Target Date</label>
                    <Input 
                       type="date"
                       className="bg-white/5 border-white/10 focus:ring-lumina-highlight h-12 rounded-xl"
                       value={newGoal.target_date}
                       onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGoal({...newGoal, target_date: e.target.value})}
                    />
                  </div>

                  <div className="pt-4 flex gap-4">
                    <Button variant="ghost" className="w-full" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button className="w-full bg-lumina-highlight hover:bg-lumina-highlight/80 text-black font-bold uppercase tracking-widest" onClick={handleCreateGoal}>Create Goal</Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <section className="mt-20">
           <h3 className="text-lg font-bold mb-6 text-gray-400">Past Achievements</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: "Calculus Fundamentals", date: "Jan 12", student: "Alex" },
                { title: "Essay Writing Certificate", date: "Dec 18", student: "Maya" },
                { title: "Physics Lab Mastery", date: "Nov 25", student: "Alex" },
              ].map((achievement, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
                    <div className="h-10 w-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-400">
                       <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{achievement.title}</h4>
                      <p className="text-[10px] text-gray-500">{achievement.student} • Completed {achievement.date}</p>
                    </div>
                </div>
              ))}
           </div>
        </section>
      </div>
    </div>
  )
}
