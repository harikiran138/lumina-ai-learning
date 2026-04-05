"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  Users, TrendingUp, AlertCircle, BookOpen, 
  Calendar, CheckCircle, ChevronRight, Filter, 
  MessageSquare, Settings, Share2, Plus, 
  Clock, Award, Brain, Target, Shield, Heart, ShieldAlert,
  Sparkles,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ParentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState<any>(null);
  const [linkCode, setLinkCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkingError, setLinkingError] = useState("");
  const [linkingSuccess, setLinkingSuccess] = useState(false);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  
  // Goal Modal State
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ type: "academic", text: "", timeframe: "weekly" });

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getParentDashboard();
      setParentData(data);
      if (data.children?.length > 0) {
        setActiveChildId(data.children[0].id);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStudent = async () => {
    if (!linkCode.trim()) return;
    setLinking(true);
    setLinkingError("");
    try {
      const res = await api.parentLinkStudentByCode(linkCode);
      if (res.status === "success" || res.success) {
        setLinkingSuccess(true);
        setTimeout(() => {
          setLinkingSuccess(false);
          setLinkCode("");
          fetchDashboard();
        }, 2000);
      } else {
        setLinkingError(res.detail || res.message || "Invalid code. Please try again.");
      }
    } catch (err: any) {
      setLinkingError(err.message || "Failed to link student.");
    } finally {
      setLinking(false);
    }
  };

  const handleAddGoal = async () => {
    if (!activeChildId || !newGoal.text) return;
    try {
      await api.setParentGoal(
        activeChildId,
        newGoal.type,
        newGoal.text,
        newGoal.timeframe
      );
      setShowGoalModal(false);
      setNewGoal({ type: "academic", text: "", timeframe: "weekly" });
      fetchDashboard();
    } catch (err) {
      console.error("Failed to add goal:", err);
    }
  };

  const activeStudent = useMemo(() => {
    return parentData?.children?.find((c: any) => c.id === activeChildId) || parentData?.children?.[0];
  }, [parentData, activeChildId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 border-4 border-[#efe9de] border-t-[#8c7851] rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Shield className="w-8 h-8 text-[#8c7851]/20" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-[#8c7851] font-display font-black text-xl italic">Curating Guardian Intelligence</p>
            <p className="text-[#b8a994] text-xs font-bold uppercase tracking-widest">Aggregating real-time data</p>
          </div>
        </div>
      </div>
    );
  }

  // Show link form if no student is linked
  if (!activeStudent) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 backdrop-blur-2xl p-12 rounded-[3rem] shadow-2xl border border-[#efe9de] text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#efe9de]/30 rounded-full blur-3xl -mr-32 -mt-32" />
          
          <div className="relative z-10">
            <div className="mx-auto w-24 h-24 bg-[#8c7851]/5 rounded-[2rem] flex items-center justify-center mb-8 border border-[#8c7851]/10">
              <Users size={48} className="text-[#8c7851]" />
            </div>
            
            <h1 className="text-4xl font-display font-black text-[#4a3f35] mb-4 tracking-tight">
               Establish Your <span className="text-[#8c7851]">Guardian</span> Connection
            </h1>
            <p className="text-[#807060] mb-12 max-w-xl mx-auto leading-relaxed font-medium">
              Link your child's student account to begin monitoring their progress, 
              viewing AI reports, and supporting their academic journey with Lumina AI.
            </p>
            
            <div className="space-y-6 max-w-md mx-auto">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#8c7851] to-[#b8a994] opacity-0 group-focus-within:opacity-10 rounded-2xl transition-opacity duration-500" />
                <input
                  type="text"
                  placeholder="Enter Student Link Code"
                  className="w-full h-16 px-8 bg-white/80 border border-[#efe9de] rounded-2xl focus:border-[#8c7851] outline-none transition-all text-[#4a3f35] font-bold placeholder-[#c4b5a2] uppercase tracking-[0.2em] shadow-sm text-center"
                  value={linkCode}
                  onChange={(e) => setLinkCode(e.target.value.toUpperCase())}
                />
                <AnimatePresence>
                  {linkingSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500"
                    >
                      <CheckCircle size={28} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {linkingError && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm font-bold bg-red-50 py-2 rounded-lg"
                >
                  {linkingError}
                </motion.p>
              )}
              
              <Button
                onClick={handleLinkStudent}
                disabled={linking}
                className="w-full h-16 bg-[#4a3f35] hover:bg-[#2c241e] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#4a3f35]/20 group transition-all"
              >
                {linking ? "Authenticating..." : "Synchronize Account"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <div className="pt-8 border-t border-[#efe9de]">
                <p className="text-xs text-[#b8a994] font-bold uppercase tracking-widest">
                  Where to find the code?
                </p>
                <p className="text-sm text-[#807060] mt-2 italic">
                  The link code is located in the <strong>Lumina Student Dashboard</strong> under Profile Settings.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* PREMIUM DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-8 bg-[#8c7851] rounded-full" />
            <span className="text-[#8c7851] text-[10px] font-black uppercase tracking-[0.3em]">Guardian Intelligence Overview</span>
          </div>
          <h1 className="text-4xl font-display font-black text-[#4a3f35] tracking-tight">
             Academic <span className="text-[#8c7851]">Trajectory</span>
          </h1>
          <p className="text-[#807060] font-medium flex items-center gap-2">
            Monitoring <span className="font-bold text-[#4a3f35]">{activeStudent.name}&apos;s</span> performance and engagement.
            <Shield className="w-3 h-3 text-[#8c7851]" />
          </p>
        </motion.div>

        {/* CHILD SELECTOR */}
        <div className="flex items-center gap-3 p-2 bg-white/40 backdrop-blur-2xl border border-[#efe9de] rounded-[2rem] shadow-sm">
          {parentData?.children?.map((child: any) => (
            <button
              key={child.id}
              onClick={() => setActiveChildId(child.id)}
              className={cn(
                "px-6 py-2.5 rounded-[1.5rem] text-sm font-bold transition-all duration-300 relative overflow-hidden group",
                activeChildId === child.id
                  ? "bg-[#8c7851] text-white shadow-lg shadow-[#8c7851]/20 scale-105"
                  : "text-[#807060] hover:text-[#4a3f35] hover:bg-[#8c7851]/5"
              )}
            >
              {child.name}
              {activeChildId === child.id && (
                <motion.div 
                  layoutId="activeChild"
                  className="absolute inset-0 bg-white/10"
                />
              )}
            </button>
          ))}
          <button className="w-10 h-10 rounded-full border border-[#efe9de] flex items-center justify-center text-[#8c7851] hover:bg-[#8c7851] hover:text-white transition-all">
            <Plus size={20} />
          </button>
        </div>
      </div>

      {!activeStudent.verified && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-[#8c7851]/10 border border-[#8c7851]/20 rounded-[2rem] flex items-center gap-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ShieldAlert size={80} />
          </div>
          <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl text-[#8c7851] border border-[#efe9de] shrink-0">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-[#4a3f35] text-lg">Relationship Verification Pending</h3>
            <p className="text-[#807060] text-sm max-w-2xl font-medium">
              Your connection to <strong>{activeStudent.name}</strong> is established but awaiting secondary verification. Some granular insights may be restricted until confirmed.
            </p>
          </div>
          <Button variant="outline" className="ml-auto border-[#8c7851]/30 text-[#8c7851] font-bold rounded-xl hidden md:flex">
             Help Center
          </Button>
        </motion.div>
      )}

      {/* ACTION BUTTONS ROW */}
      <div className="flex gap-4">
        <Button 
          onClick={() => setShowGoalModal(true)}
          className="bg-[#8c7851] hover:bg-[#726242] text-white font-black px-8 h-14 rounded-2xl shadow-xl shadow-[#8c7851]/20 flex items-center gap-3 transition-all"
        >
          <Target className="w-5 h-5" />
          Set New Objective
        </Button>
        <Button 
          variant="outline"
          className="bg-white/40 border-[#efe9de] text-[#4a3f35] font-black px-8 h-14 rounded-2xl hover:bg-white hover:shadow-lg transition-all flex items-center gap-3"
        >
          <Share2 className="w-5 h-5" />
          Export Intelligence
        </Button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: MAIN ANALYTICS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* TOP METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { 
                label: "Current Mastery", 
                value: `${activeStudent.mastery || 0}%`, 
                trend: "+4.2%", 
                icon: Award, 
                color: "#8c7851",
                bg: "bg-[#8c7851]/5"
              },
              { 
                label: "Course Velocity", 
                value: "High", 
                trend: "Optimal", 
                icon: TrendingUp, 
                color: "#6b5c3d",
                bg: "bg-[#6b5c3d]/5"
              },
              { 
                label: "Weekly Study", 
                value: `${activeStudent.usage?.totalHours || 0}h`, 
                trend: "14h Target", 
                icon: Clock, 
                color: "#4a3f35",
                bg: "bg-[#4a3f35]/5"
              }
            ].map((metric, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * idx }}
                className="group bg-white/60 backdrop-blur-xl border border-[#efe9de] p-8 rounded-[2.5rem] hover:border-[#8c7851]/30 hover:shadow-xl transition-all duration-500"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("p-4 rounded-2xl text-[#8c7851] transition-transform group-hover:scale-110 duration-500", metric.bg)}>
                    <metric.icon size={24} />
                  </div>
                  <Badge className="bg-[#8c7851] text-white border-none rounded-full px-3 font-black text-[10px]">
                    {metric.trend}
                  </Badge>
                </div>
                <p className="text-[10px] font-black text-[#b8a994] uppercase tracking-[0.2em] mb-1">{metric.label}</p>
                <h4 className="text-3xl font-display font-black text-[#4a3f35]">{metric.value}</h4>
              </motion.div>
            ))}
          </div>

          {/* MAIN CHART */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl border border-[#efe9de] p-10 rounded-[3rem] shadow-sm relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-80 h-80 bg-[#fdfaf5]/50 rounded-full blur-3xl -mr-40 -mt-40" />
             
             <div className="flex justify-between items-center mb-12 relative z-10">
                <div>
                   <h3 className="text-2xl font-display font-black text-[#4a3f35]">Absorption Velocity</h3>
                   <p className="text-sm text-[#807060] font-medium italic">Measuring conceptual retention over time.</p>
                </div>
                <div className="flex bg-[#efe9de]/50 p-1.5 rounded-2xl border border-[#efe9de]">
                  {["7D", "30D", "ALL"].map((t) => (
                    <button key={t} className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all",
                      t === "7D" ? "bg-white text-[#4a3f35] shadow-sm" : "text-[#b8a994] hover:text-[#8c7851]"
                    )}>{t}</button>
                  ))}
                </div>
             </div>

             <div className="h-[350px] w-full relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { date: 'Mon', val: 68 }, { date: 'Tue', val: 74 },
                    { date: 'Wed', val: 72 }, { date: 'Thu', val: 85 },
                    { date: 'Fri', val: 82 }, { date: 'Sat', val: 92 },
                    { date: 'Sun', val: 88 },
                  ]}>
                    <defs>
                      <linearGradient id="premiumGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8c7851" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8c7851" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="6 6" stroke="#efe9de" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#b8a994', fontSize: 11, fontWeight: 700}} dy={15} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#b8a994', fontSize: 11, fontWeight: 700}} width={40} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: '1px solid #efe9de', boxShadow: '0 20px 40px rgba(140,120,81,0.1)', background: 'rgba(255,255,255,0.95)', padding: '16px' }}
                      itemStyle={{ fontWeight: 900, color: '#4a3f35' }}
                    />
                    <Area type="monotone" dataKey="val" stroke="#8c7851" strokeWidth={5} fillOpacity={1} fill="url(#premiumGold)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </motion.div>

          {/* SUBJECT PROFICIENCY LIST */}
          <div className="bg-white/60 backdrop-blur-xl border border-[#efe9de] p-10 rounded-[3rem] shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-display font-black text-[#4a3f35]">Competency Matrix</h3>
                <Link href="/parent/progress" className="text-[#8c7851] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                   Deep Diagnostics <ChevronRight size={14} />
                </Link>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                {activeStudent.usage?.subjectBreakdown?.map((subject: any, idx: number) => (
                  <div key={idx} className="space-y-4 group">
                    <div className="flex justify-between items-end">
                      <div>
                         <p className="text-[10px] font-black text-[#b8a994] uppercase tracking-widest mb-1">Subject</p>
                         <h4 className="text-lg font-bold text-[#4a3f35] group-hover:text-[#8c7851] transition-colors">{subject.subject}</h4>
                      </div>
                      <div className="text-right">
                         <span className="text-2xl font-display font-black text-[#8c7851]">{subject.percentage}%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-[#efe9de] rounded-full overflow-hidden p-0.5 border border-[#efe9de]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.percentage}%` }}
                        transition={{ duration: 1.5, delay: idx * 0.1 }}
                        className="h-full bg-gradient-to-r from-[#4a3f35] via-[#8c7851] to-[#b8a994] rounded-full"
                      />
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI & ALERTS */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* AI GUARDIAN INSIGHT */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#4a3f35] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group"
          >
             <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
               <Brain size={120} />
             </div>

             <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8 border-dashed">
                   <Sparkles className="w-4 h-4 text-[#8c7851]" />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lumina AI Counselor</span>
                </div>

                <h3 className="text-3xl font-display font-medium mb-6 leading-tight italic">
                   &quot;{activeStudent.name} is accelerating in <span className="text-[#8c7851] font-black not-italic underline underline-offset-4 decoration-white/20">Conceptual Logic</span>.&quot;
                </h3>
                
                <p className="text-white/70 text-sm leading-relaxed mb-10 font-medium">
                  Analysis indicates a 40% faster retention rate in Abstract Mathematics. We suggest providing additional challenge modules in Physics to maintain this cognitive momentum.
                </p>

                <div className="grid grid-cols-2 gap-4">
                   <Button className="bg-[#8c7851] hover:bg-white hover:text-[#4a3f35] text-white font-black rounded-2xl h-14 border-none shadow-lg">
                      View Advice
                   </Button>
                   <Button variant="outline" className="border-white/20 text-white font-black rounded-2xl h-14 hover:bg-white/10">
                      Export Plan
                   </Button>
                </div>
             </div>
          </motion.div>

          {/* ALERTS SECTION */}
          <div className="bg-white/60 backdrop-blur-xl border border-[#efe9de] p-10 rounded-[3rem] shadow-sm">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-display font-black text-[#4a3f35]">Guardian Alerts</h3>
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
             </div>

             <div className="space-y-4">
                {[
                  { title: "Engagement Peak", desc: "Longest study session in 3 months", time: "2h ago", icon: TrendingUp, mode: "success" },
                  { title: "Assignment Caution", desc: "History module progress is slower", time: "5h ago", icon: AlertCircle, mode: "warning" },
                  { title: "New Achievement", desc: "Earned the 'Logic Master' badge", time: "1d ago", icon: Award, mode: "premium" },
                ].map((alert, idx) => (
                  <div key={idx} className="flex gap-5 p-5 rounded-[2rem] hover:bg-white/80 transition-all cursor-pointer group border border-transparent hover:border-[#efe9de]">
                     <div className={cn(
                       "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
                       alert.mode === "success" && "bg-green-50 text-green-600 border-green-100",
                       alert.mode === "warning" && "bg-amber-50 text-amber-600 border-amber-100",
                       alert.mode === "premium" && "bg-[#8c7851]/10 text-[#8c7851] border-[#8c7851]/20"
                     )}>
                       <alert.icon size={24} />
                     </div>
                     <div className="space-y-1 flex-1">
                        <div className="flex justify-between items-start">
                           <h4 className="text-sm font-black text-[#4a3f35]">{alert.title}</h4>
                           <span className="text-[9px] font-black text-[#b8a994] uppercase tracking-tighter">{alert.time}</span>
                        </div>
                        <p className="text-xs text-[#807060] font-medium leading-relaxed">{alert.desc}</p>
                     </div>
                     <ChevronRight className="w-4 h-4 text-[#efe9de] self-center group-hover:text-[#8c7851] group-hover:translate-x-1 transition-all" />
                  </div>
                ))}
             </div>

             <Button variant="ghost" className="w-full mt-10 h-14 text-[#8c7851] font-black hover:bg-[#8c7851]/5 rounded-2xl">
                Full Notification History
             </Button>
          </div>

          {/* UPCOMING EVENTS */}
          <div className="bg-[#efe9de]/40 border border-[#efe9de] p-10 rounded-[3rem] relative overflow-hidden">
             <h3 className="text-lg font-display font-black text-[#4a3f35] mb-8 flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#8c7851]" />
                Upcoming Milestones
             </h3>
             <div className="space-y-8">
                <div className="flex gap-5 group">
                   <div className="w-14 h-14 bg-white rounded-2xl border border-[#efe9de] flex flex-col items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                      <span className="text-[10px] font-black text-[#8c7851] uppercase">Apr</span>
                      <span className="text-xl font-display font-black text-[#4a3f35]">15</span>
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-sm font-black text-[#4a3f35] group-hover:text-[#8c7851] transition-colors">Mid-Term Verification</p>
                      <p className="text-[10px] font-bold text-[#b8a994] uppercase tracking-[0.1em]">Verified Report Delivery</p>
                   </div>
                </div>
                <div className="flex gap-5 group opacity-60 hover:opacity-100 transition-opacity">
                   <div className="w-14 h-14 bg-white rounded-2xl border border-[#efe9de] flex flex-col items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
                      <span className="text-[10px] font-black text-[#8c7851] uppercase">May</span>
                      <span className="text-xl font-display font-black text-[#4a3f35]">02</span>
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-sm font-black text-[#4a3f35]">Physics Olympiad</p>
                      <p className="text-[10px] font-bold text-[#b8a994] uppercase tracking-[0.1em]">Regional Competition</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* GOAL MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-[#2c241e]/80 backdrop-blur-md" 
               onClick={() => setShowGoalModal(false)} 
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="bg-white relative w-full max-w-xl rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] p-12 border border-[#efe9de] overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#fdfaf5] rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                
                <h3 className="text-4xl font-display font-black text-[#4a3f35] mb-2 tracking-tight relative z-10">New Academic <span className="text-[#8c7851]">Directive</span></h3>
                <p className="text-[#807060] mb-10 font-medium relative z-10 italic">Define a high-impact growth target for your student.</p>
                
                <div className="space-y-8 relative z-10">
                   <div>
                      <label className="text-[10px] font-black text-[#8c7851] uppercase tracking-[0.3em] mb-3 block">Perspective</label>
                      <div className="grid grid-cols-2 gap-4">
                         {['academic', 'behavioral'].map(t => (
                           <button 
                             key={t}
                             onClick={() => setNewGoal({...newGoal, type: t})}
                             className={cn(
                               "h-14 rounded-2xl font-black capitalize transition-all border-2",
                               newGoal.type === t ? "bg-[#8c7851] border-[#8c7851] text-white shadow-lg" : "bg-white border-[#efe9de] text-[#b8a994] hover:border-[#8c7851]/30"
                             )}
                           >
                             {t}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-[#8c7851] uppercase tracking-[0.3em] block">Objective Description</label>
                      <textarea 
                        value={newGoal.text}
                        onChange={(e) => setNewGoal({...newGoal, text: e.target.value})}
                        className="w-full min-h-[160px] p-6 bg-[#fdfaf5] border border-[#efe9de] rounded-3xl focus:bg-white focus:border-[#8c7851] outline-none transition-all placeholder-[#c4b5a2] text-[#4a3f35] font-bold text-lg leading-relaxed shadow-inner"
                        placeholder="e.g. Master Differential Equations with 95% retention..."
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div>
                         <label className="text-[10px] font-black text-[#8c7851] uppercase tracking-[0.3em] mb-3 block">Horizon</label>
                         <div className="relative">
                            <select 
                              value={newGoal.timeframe}
                              onChange={(e) => setNewGoal({...newGoal, timeframe: e.target.value})}
                              className="w-full h-14 pl-6 pr-10 bg-[#fdfaf5] border border-[#efe9de] rounded-2xl outline-none focus:bg-white focus:border-[#8c7851] text-[#4a3f35] font-black appearance-none cursor-pointer shadow-sm"
                            >
                              <option value="weekly">Weekly Cycle</option>
                              <option value="biweekly">Bi-Weekly Phase</option>
                              <option value="monthly">Quarterly Horizon</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8c7851] w-5 h-5 pointer-events-none" />
                         </div>
                      </div>
                      <div className="flex items-end gap-3">
                         <Button 
                           onClick={() => setShowGoalModal(false)}
                           variant="ghost"
                           className="flex-1 h-14 rounded-2xl font-black text-[#b8a994] hover:bg-[#fdfaf5] border border-transparent hover:border-[#efe9de]"
                         >
                            Cancel
                         </Button>
                         <Button 
                           onClick={handleAddGoal}
                           className="flex-[2] h-14 rounded-2xl font-black bg-[#8c7851] text-white shadow-xl shadow-[#8c7851]/40 hover:bg-[#726242] transition-all"
                         >
                            Publish Goal
                         </Button>
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ParentDashboardPage;
