"use client";

import React, { useState, useEffect } from "react";
import { 
  LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  Users, TrendingUp, AlertCircle, BookOpen, 
  Calendar, CheckCircle, ChevronRight, Filter, 
  MessageSquare, Settings, Share2, Plus, 
  Clock, Award, Brain, Target, Shield, Heart
} from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";

const ParentDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState<any>(null);
  const [linkCode, setLinkCode] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkingError, setLinkingError] = useState("");
  const [linkingSuccess, setLinkingSuccess] = useState(false);
  
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
      if (res.success) {
        setLinkingSuccess(true);
        setTimeout(() => {
          setLinkingSuccess(false);
          setLinkCode("");
          fetchDashboard();
        }, 2000);
      } else {
        setLinkingError(res.detail || "Invalid code. Please try again.");
      }
    } catch (err: any) {
      setLinkingError(err.message || "Failed to link student.");
    } finally {
      setLinking(false);
    }
  };

  const handleAddGoal = async () => {
    if (!parentData?.children?.[0]?.id || !newGoal.text) return;
    try {
      await api.setParentGoal(
        parentData.children[0].id,
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fdfaf5]">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[#e8d5b5] border-t-[#8c7851]"></div>
          <div className="absolute inset-x-0 -bottom-8 whitespace-nowrap text-center text-sm font-medium text-[#8c7851]">
            Curating your dashboard...
          </div>
        </div>
      </div>
    );
  }

  const children = parentData?.children || [];
  const activeStudent = children[0]; // Simple case for now
  
  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-[#fdfaf5] p-8">
        <div className="mx-auto max-w-2xl bg-white p-12 rounded-3xl shadow-xl border border-[#efe9de] text-center">
          <div className="mx-auto w-24 h-24 bg-[#f8f5ee] rounded-full flex items-center justify-center mb-6">
            <Users size={48} className="text-[#8c7851]" />
          </div>
          <h1 className="text-3xl font-serif text-[#4a3f35] mb-4">Welcome to Lumina AI</h1>
          <p className="text-[#807060] mb-8 leading-relaxed">
            Link your child's student account to begin monitoring their progress, 
            viewing AI reports, and supporting their academic journey.
          </p>
          
          <div className="space-y-4 max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Student Link Code"
                className="w-full h-14 px-6 bg-[#f8f5ee] border-2 border-transparent rounded-xl focus:border-[#8c7851] focus:bg-white outline-none transition-all text-[#4a3f35] placeholder-[#c4b5a2]"
                value={linkCode}
                onChange={(e) => setLinkCode(e.target.value)}
              />
              {linkingSuccess && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 animate-in fade-in zoom-in">
                  <CheckCircle size={24} />
                </div>
              )}
            </div>
            
            {linkingError && (
              <p className="text-red-500 text-sm font-medium">{linkingError}</p>
            )}
            
            <button
              onClick={handleLinkStudent}
              disabled={linking}
              className="w-full h-14 bg-[#8c7851] text-white rounded-xl font-bold shadow-lg shadow-[#8c785144] hover:bg-[#726242] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {linking ? "Verify Code..." : "Connect Student Account"}
            </button>
            <p className="text-xs text-[#b8a994] mt-4">
              Your child can find their link code in their <strong>Lumina Student Dashboard</strong> under 'Account Settings'.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfaf5] pb-12">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-[#efe9de]">
        <div className="max-w-[1400px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-[#8c7851] rounded-2xl flex items-center justify-center shadow-lg shadow-[#8c785133]">
              <Brain className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-serif text-[#4a3f35]">Guardian Dashboard</h1>
              <div className="flex items-center gap-2 text-sm text-[#8c7851]">
                <Shield size={14} />
                <span className="font-medium">Verified Relationship: {activeStudent.relationship}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-3 text-[#8c7851] hover:bg-[#f8f5ee] rounded-xl transition-all relative">
              <MessageSquare size={20} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
            <button className="p-3 text-[#8c7851] hover:bg-[#f8f5ee] rounded-xl transition-all">
              <Settings size={20} />
            </button>
            <div className="w-px h-8 bg-[#efe9de]"></div>
            <div className="flex items-center gap-3 pl-2">
              <img 
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-[#e8d5b5]" 
                alt="Parent"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 pt-8">
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between items-start gap-4">
          <div>
            <span className="text-[#8c7851] font-bold text-sm tracking-widest uppercase mb-2 block">Premium Learning Support</span>
            <h2 className="text-4xl font-serif text-[#3a2f26]">Good morning, {activeStudent.name}'s Guardian</h2>
            <p className="text-[#807060] mt-2">Here is the latest snapshot of your student's learning momentum.</p>
          </div>
          
          <div className="flex gap-3">
             <button 
              onClick={() => setShowGoalModal(true)}
              className="px-6 h-12 bg-[#8c7851] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#8c785144] hover:bg-[#726242] transition-colors"
             >
              <Target size={18} />
              Set Academic Goal
            </button>
            <button className="px-6 h-12 bg-white text-[#8c7851] border border-[#e8d5b5] rounded-xl font-bold flex items-center gap-2 hover:bg-[#faf9f6] transition-colors shadow-sm">
              <Share2 size={18} />
              Weekly Report
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Course Progress", value: "84%", trend: "+12%", icon: BookOpen, color: "bg-blue-50 text-blue-600" },
            { label: "Concept Mastery", value: "A-", trend: "0.4 pts", icon: Brain, color: "bg-purple-50 text-purple-600" },
            { label: "Engagement", value: "High", trend: "Stable", icon: Heart, color: "bg-red-50 text-red-600" },
            { label: "Active Streak", value: "14 Days", trend: "+2", icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-[#efe9de] shadow-sm hover:translate-y-[-4px] transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  {stat.trend}
                </div>
              </div>
              <p className="text-[#807060] text-sm font-medium mb-1">{stat.label}</p>
              <h4 className="text-2xl font-serif text-[#4a3f35] font-bold">{stat.value}</h4>
            </div>
          ))}
        </div>

        {/* Main Content Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Progress Chart Section */}
          <section className="space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-[#efe9de] shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-serif text-[#4a3f35]">Learning Velocity</h3>
                  <p className="text-sm text-[#b8a994]">Aggregate progress across all enrolled courses</p>
                </div>
                <div className="flex bg-[#f8f5ee] rounded-xl p-1">
                  <button className="px-4 py-2 text-xs font-bold bg-[#8c7851] text-white rounded-lg shadow-sm">Week</button>
                  <button className="px-4 py-2 text-xs font-bold text-[#b8a994]">Month</button>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { date: 'Mon', progress: 65 },
                    { date: 'Tue', progress: 68 },
                    { date: 'Wed', progress: 75 },
                    { date: 'Thu', progress: 72 },
                    { date: 'Fri', progress: 84 },
                    { date: 'Sat', progress: 84 },
                    { date: 'Sun', progress: 88 },
                  ]}>
                    <defs>
                      <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8c7851" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8c7851" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#b8a994', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#b8a994', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="progress" stroke="#8c7851" strokeWidth={4} fillOpacity={1} fill="url(#colorProgress)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Courses Overview */}
            <div className="bg-white p-8 rounded-[40px] border border-[#efe9de] shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif text-[#4a3f35]">Detailed Subjects</h3>
                <Link href="/parent/progress" className="text-[#8c7851] font-bold text-sm flex items-center hover:translate-x-1 transition-all">
                  Deep Analytics <ChevronRight size={16} />
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { name: "Advanced Mathematics", progress: 88, status: "Ahead", color: "bg-[#8c7851]" },
                  { name: "Data Structures", progress: 64, status: "Steady", color: "bg-[#e8d5b5]" },
                  { name: "Applied Physics", progress: 72, status: "Review needed", color: "bg-[#b8a994]" },
                ].map((course, i) => (
                  <div key={i} className="p-5 rounded-2xl bg-[#fdfaf5] border border-transparent hover:border-[#e8d5b5] hover:bg-white transition-all group">
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-bold text-[#4a3f35] group-hover:text-[#8c7851] transition-colors">{course.name}</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#b8a994]">{course.status}</span>
                    </div>
                    <div className="w-full bg-[#efe9de] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${course.color} rounded-full transition-all duration-1000`} 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Side Column: AI Insights & Alerts */}
          <section className="space-y-8">
            {/* AI Insight Box */}
            <div className="bg-[#4a3f35] p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-[-40px] right-[-40px] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <Brain size={24} className="text-[#e8d5b5]" />
                  </div>
                  <h3 className="text-xl font-serif text-[#e8d5b5]">Lumina AI Insight</h3>
                </div>
                <p className="text-lg leading-relaxed text-[#fdfaf5] mb-6 font-serif italic text-white/90">
                  "{activeStudent.name} is demonstrating exceptional cognitive focus in Mathematics. 
                  However, interest in Physics has dipped recently. We recommend checking if the 
                  last module on 'Quantum Mechanics' was particularly challenging."
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 bg-white text-[#4a3f35] rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-all">Support Plan</button>
                  <button className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl text-sm font-bold backdrop-blur-md hover:bg-white/20 transition-all">Acknowledge</button>
                </div>
              </div>
            </div>

            {/* Real-time Alerts */}
            <div className="bg-white p-8 rounded-[40px] border border-[#efe9de] shadow-xl">
              <h3 className="text-2xl font-serif text-[#4a3f35] mb-6">Active Notifications</h3>
              <div className="space-y-4">
                {[
                  { title: "Assignment Submitted", student: activeStudent.name, time: "2h ago", icon: CheckCircle, type: "success" },
                  { title: "Missing Attendance", student: activeStudent.name, time: "8h ago", icon: AlertCircle, type: "urgent" },
                  { title: "Upcoming Exam", student: "Applied Physics", time: "2 days", icon: Calendar, type: "info" },
                ].map((alert, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-[#f8f5ee] transition-all cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 
                      ${alert.type === 'success' ? 'bg-green-50 text-green-600' : 
                        alert.type === 'urgent' ? 'bg-red-50 text-red-600' : 
                        'bg-blue-50 text-blue-600'}`}>
                      <alert.icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[#4a3f35] text-sm">{alert.title}</h4>
                      <p className="text-[#807060] text-xs mt-1">{alert.student} • {alert.time}</p>
                    </div>
                    <ChevronRight size={14} className="text-[#b8a994] self-center" />
                  </div>
                ))}
              </div>
              <button className="w-full mt-6 py-4 bg-[#f8f5ee] text-[#8c7851] rounded-2xl font-bold hover:bg-[#f2efe6] transition-all">
                Notification History
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Goal Creation Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#4a3f35]/60 backdrop-blur-sm" onClick={() => setShowGoalModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl p-10 animate-in zoom-in slide-in-from-bottom-4">
            <h3 className="text-3xl font-serif text-[#4a3f35] mb-2">New Growth Target</h3>
            <p className="text-[#807060] mb-8">Set a supportive academic or behavioral goal for {activeStudent.name}.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-[#8c7851] uppercase tracking-widest mb-2 block">Category</label>
                <div className="grid grid-cols-2 gap-4">
                  {['academic', 'behavioral'].map(t => (
                    <button 
                      key={t}
                      onClick={() => setNewGoal({...newGoal, type: t})}
                      className={`h-12 rounded-xl font-bold border-2 capitalize transition-all ${newGoal.type === t ? 'border-[#8c7851] bg-[#8c7851] text-white shadow-lg' : 'border-[#efe9de] text-[#b8a994] hover:border-[#e8d5b5]'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-[#8c7851] uppercase tracking-widest mb-2 block">The Goal</label>
                <textarea 
                  value={newGoal.text}
                  onChange={(e) => setNewGoal({...newGoal, text: e.target.value})}
                  className="w-full min-h-[120px] p-4 bg-[#f8f5ee] border-2 border-transparent rounded-2xl focus:bg-white focus:border-[#8c7851] outline-none transition-all placeholder-[#c4b5a2] text-[#4a3f35] font-medium"
                  placeholder="e.g. Complete math exercises with >80% accuracy..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#8c7851] uppercase tracking-widest mb-2 block">Timeframe</label>
                <select 
                  value={newGoal.timeframe}
                  onChange={(e) => setNewGoal({...newGoal, timeframe: e.target.value})}
                  className="w-full h-14 px-4 bg-[#f8f5ee] border-2 border-transparent rounded-xl outline-none focus:bg-white focus:border-[#8c7851] text-[#4a3f35] font-bold appearance-none cursor-pointer"
                >
                  <option value="weekly">This Week</option>
                  <option value="biweekly">Next 2 Weeks</option>
                  <option value="monthly">This Month</option>
                </select>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  onClick={() => setShowGoalModal(false)}
                  className="flex-1 h-14 rounded-2xl font-bold text-[#b8a994] hover:bg-[#f8f5ee] transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddGoal}
                  className="flex-1 h-14 rounded-2xl font-bold bg-[#8c7851] text-white shadow-xl shadow-[#8c785144] hover:bg-[#726242] transition-all"
                >
                  Confirm Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
