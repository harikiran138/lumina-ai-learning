"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  BookOpen, 
  Clock,
  ChevronRight,
  Filter,
  Download,
  Calendar,
  Users
} from "lucide-react"
import { RealAPI } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ParentProgressPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)

  const api = RealAPI.getInstance()

  useEffect(() => {
    async function fetchData() {
      try {
        const dashboard = await api.getParentDashboard()
        setData(dashboard)
        if (dashboard?.children?.length > 0) {
          setSelectedChild(dashboard.children[0].id)
        }
      } catch (err) {
        console.error("Failed to load progress data", err)
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

  const activeChild = data?.children?.find((c: any) => c.id === selectedChild) || data?.children?.[0]

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Detailed Progress</h1>
            <p className="text-gray-400">In-depth analysis of learning growth and subject mastery.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-1.5 rounded-xl">
            {data?.children?.map((child: any) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedChild === child.id 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </header>

        {activeChild && (
          <div className="space-y-10">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-none">+5% vs last month</Badge>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Overall Mastery</h3>
                <p className="text-3xl font-bold">{activeChild.mastery}%</p>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                    <Target className="h-6 w-6" />
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-400 border-none">On Track</Badge>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Learning Consistency</h3>
                <p className="text-3xl font-bold">92%</p>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-orange-500/10 rounded-xl text-orange-400">
                    <Award className="h-6 w-6" />
                  </div>
                  <Badge className="bg-orange-500/10 text-orange-400 border-none">12 Unlocked</Badge>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Skill Milestones</h3>
                <p className="text-3xl font-bold">48</p>
              </Card>

              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-green-500/10 rounded-xl text-green-400">
                    <Clock className="h-6 w-6" />
                  </div>
                  <Badge className="bg-green-500/10 text-green-400 border-none">Daily Avg</Badge>
                </div>
                <h3 className="text-gray-400 text-sm mb-1">Active Study Time</h3>
                <p className="text-3xl font-bold">1h 45m</p>
              </Card>
            </div>

            {/* Subject Mastery Heatmap Simulation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/10 p-8">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-400" />
                  Subject Mastery
                </h3>
                <div className="space-y-6">
                  {[
                    { subject: "Advanced Mathematics", mastery: 88, color: "bg-blue-500" },
                    { subject: "Quantum Physics", mastery: 72, color: "bg-purple-500" },
                    { subject: "Computer Science", mastery: 94, color: "bg-green-500" },
                    { subject: "World History", mastery: 65, color: "bg-orange-500" },
                  ].map((sub) => (
                    <div key={sub.subject}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-300 font-medium">{sub.subject}</span>
                        <span className="font-bold">{sub.mastery}%</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${sub.mastery}%` }}
                          className={`h-full ${sub.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 p-8 flex flex-col justify-center items-center text-center">
                <div className="h-32 w-32 rounded-full border-8 border-purple-500/20 flex items-center justify-center mb-6 relative">
                   <div className="absolute inset-0 rounded-full border-8 border-purple-500 border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                   <div className="text-center">
                     <span className="text-2xl font-bold">85%</span>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest">Efficiency</p>
                   </div>
                </div>
                <h3 className="text-lg font-bold mb-2">Learning Efficiency Index</h3>
                <p className="text-gray-400 text-sm max-w-xs mb-6">
                  {activeChild.name} is learning faster than 78% of their peer group in STEM subjects.
                </p>
                <div className="grid grid-cols-2 gap-4 w-full">
                   <div className="bg-white/5 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Focus</p>
                      <p className="text-lg font-bold">High</p>
                   </div>
                   <div className="bg-white/5 p-4 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">Retention</p>
                      <p className="text-lg font-bold">A+</p>
                   </div>
                </div>
              </Card>
            </div>

            {/* Growth Chart Simulation */}
            <Card className="bg-white/5 border-white/10 p-8">
               <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-bold flex items-center gap-2">
                   <BarChart2 className="h-5 w-5 text-blue-400" />
                   Growth Trajectory
                 </h3>
                 <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10">
                     <Calendar className="h-4 w-4 mr-2" />
                     Last 3 Months
                   </Button>
                   <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                     <Download className="h-4 w-4" />
                   </Button>
                 </div>
               </div>
               
               <div className="h-64 w-full bg-white/5 rounded-2xl relative overflow-hidden flex items-end px-8 pb-4 gap-4">
                  {/* Decorative Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                    {[1,2,3,4].map(i => <div key={i} className="border-t border-white/20 w-full" />)}
                  </div>
                  
                  {/* Bars */}
                  {[45, 52, 48, 65, 72, 68, 85, 82, 90, 88, 94, 95].map((val, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${val}%` }}
                      transition={{ delay: i * 0.05 }}
                      className="flex-1 bg-gradient-to-t from-purple-600/40 to-blue-500/60 rounded-t-sm relative group cursor-pointer"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {val}%
                      </div>
                    </motion.div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 px-8 text-[10px] text-gray-500 font-medium">
                  <span>WEEK 1</span>
                  <span>WEEK 2</span>
                  <span>WEEK 3</span>
                  <span>WEEK 4</span>
                  <span>WEEK 5</span>
                  <span>WEEK 6</span>
                  <span>WEEK 7</span>
                  <span>WEEK 8</span>
                  <span>WEEK 9</span>
                  <span>WEEK 10</span>
                  <span>WEEK 11</span>
                  <span>WEEK 12</span>
               </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
