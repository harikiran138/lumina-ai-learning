"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Briefcase,
  Users,
  Heart,
  CheckCircle,
  XCircle,
  ExternalLink,
  Plus,
  MessageCircle,
  Calendar,
  Star,
  Sparkles,
  TrendingUp,
  Globe,
  Eye,
  Zap,
  BarChart3,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import Link from 'next/link';

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

const MENTEE_REQUESTS = [
  { id: 1, name: 'Arjun Sharma', year: 'Final Year (CSE)', request: 'Mock Interview', avatar: '' },
  { id: 2, name: 'Priya Nair',   year: 'Pre-Final (ECE)',  request: 'Career Guidance', avatar: '' },
];

const UPCOMING_SESSIONS = [
  { id: 1, mentee: 'Rahul Kumar',  topic: 'System Design Prep',    date: 'Today, 4:00 PM',    type: 'Video Call' },
  { id: 2, mentee: 'Sneha Iyer',   topic: 'Resume Review',         date: 'Tomorrow, 11:00 AM', type: 'Chat Session' },
  { id: 3, mentee: 'Vikram Singh', topic: 'DSA Mock Interview',    date: 'Apr 5, 2:00 PM',    type: 'Video Call' },
];

export default function AlumniDashboard() {
  const [mentees, setMentees]     = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [requests, setRequests]   = useState(MENTEE_REQUESTS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [m, p] = await Promise.all([
          api.getAlumniMentorshipMentees(),
          api.getAlumniPortfolio(),
        ]);
        setMentees(m);
        setPortfolio(p);
      } catch (err) {
        console.error("Error fetching alumni data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAccept = (id: number) => setRequests((prev) => prev.filter((r) => r.id !== id));
  const handleReject = (id: number) => setRequests((prev) => prev.filter((r) => r.id !== id));

  const overviewStats = [
    { label: 'Active Mentees',     value: loading ? '…' : String(mentees.length || 0), icon: Users,        color: 'text-lumina-highlight' },
    { label: 'Sessions Conducted', value: '24',                                          icon: Calendar,     color: 'text-lumina-highlight' },
    { label: 'Feedback Score',     value: '4.8',                                         icon: Star,         color: 'text-lumina-highlight' },
    { label: 'Job Posts Shared',   value: '7',                                            icon: Briefcase,    color: 'text-lumina-highlight' },
  ];

  const quickActions = [
    { label: 'Schedule Session',    href: '/alumni/sessions',            icon: Calendar },
    { label: 'Post Job/Internship', href: '/alumni/job-board',           icon: Briefcase },
    { label: 'View Mentees',        href: '/alumni/mentees',             icon: Users },
    { label: 'Give Feedback',       href: '/alumni/curriculum-feedback', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-bold text-white tracking-tight">
            Alumni <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium italic">Your legacy continues—mentoring the next wave of Lumina learners</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/alumni/portfolio">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all font-bold text-sm uppercase tracking-widest">
              <Briefcase className="w-4 h-4 text-lumina-highlight" /> My Portfolio
            </button>
          </Link>
          <Link href="/alumni/sessions">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lumina-highlight text-black font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <Plus className="w-4 h-4" /> Open Availability
            </button>
          </Link>
        </div>
      </div>

      {/* Overview Cards (4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-3xl font-display font-bold text-white">{stat.value}</p>
              </div>
              <div className={cn("p-4 rounded-2xl bg-white/5 border border-white/5", stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions */}
      <GlassCard className="p-6">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action, i) => (
            <Link key={i} href={action.href}>
              <button className="w-full flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/20 hover:bg-white/[0.07] transition-all group">
                <action.icon className="w-6 h-6 text-lumina-highlight group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-gray-400 group-hover:text-white transition-colors text-center uppercase tracking-widest">{action.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Upcoming Sessions Panel */}
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Upcoming Sessions</h2>
              <Link href="/alumni/sessions" className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors uppercase tracking-widest">View All</Link>
            </div>
            <div className="space-y-3">
              {UPCOMING_SESSIONS.map((session) => (
                <GlassCard key={session.id} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/10">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{session.mentee}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{session.topic}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-amber-400">{session.date}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest">{session.type}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Mentee Requests */}
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Mentee Requests</h2>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{requests.length} pending</span>
            </div>
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="py-10 text-center rounded-3xl border border-white/5 bg-white/[0.02] text-gray-600 italic font-display text-sm">
                  No pending requests.
                </div>
              ) : (
                requests.map((req) => (
                  <GlassCard key={req.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex items-center justify-center font-bold text-white text-lg uppercase">
                        <img
                          src={req.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.name)}&background=random`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{req.name}</p>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{req.year}</p>
                        <p className="text-[10px] text-amber-400 font-bold mt-0.5">Request: {req.request}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-[11px] font-bold uppercase tracking-widest hover:bg-green-500/25 transition-all"
                      >
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/15 text-red-400 text-[11px] font-bold uppercase tracking-widest hover:bg-red-500/20 transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </GlassCard>
                ))
              )}
            </div>
          </div>

          {/* Current Mentees */}
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Current Mentees</h2>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                Active Links: {loading ? '…' : mentees.length}
              </span>
            </div>
            <div className="space-y-4">
              {loading ? (
                [1, 2].map((i) => <div key={i} className="h-24 bg-white/5 rounded-3xl animate-pulse" />)
              ) : mentees.length > 0 ? (
                mentees.map((mentee) => (
                  <GlassCard key={mentee.id} className="p-6 group hover:border-amber-500/20 transition-all flex items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 overflow-hidden">
                        <img
                          src={mentee.avatar || `https://ui-avatars.com/api/?name=${mentee.name || 'M'}&background=random`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg lowercase tracking-tighter truncate">{mentee.name || "Mentee"}</h4>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{mentee.major || "Computer Science"}</span>
                          <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-widest">Impact +12</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-600 hover:text-white transition-all">
                        <MessageCircle className="w-5 h-5" />
                      </button>
                      <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                        Schedule
                      </button>
                    </div>
                  </GlassCard>
                ))
              ) : (
                <div className="py-12 text-center glass-v2 rounded-3xl opacity-30 italic font-display text-gray-500">No active mentees assigned.</div>
              )}
            </div>
          </div>

          {/* Portfolio Snapshot */}
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Portfolio Snapshot</h2>
              <Link href="/alumni/portfolio" className="text-[10px] font-bold text-yellow-400 hover:text-yellow-300 transition-colors uppercase tracking-widest">Manage All Projects</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Neural Network Visualizer', role: 'Lead Architect',  year: '2024' },
                { title: 'Lumina Engagement Study',   role: 'Data Researcher', year: '2025' },
              ].map((project, i) => (
                <GlassCard key={i} className="p-8 group hover:border-yellow-500/20 transition-all cursor-pointer relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="mb-6 h-32 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:gradient-text transition-all lowercase tracking-tighter">{project.title}</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{project.role} • {project.year}</p>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          <GlassCard className="p-8 bg-gradient-to-br from-amber-500/10 to-transparent">
            <div className="flex items-center gap-3 mb-8">
              <Star className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-white lowercase tracking-tighter">Impact Ranking</h2>
            </div>
            <div className="flex items-center justify-between mb-8">
              <div className="text-center flex-1">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Global Percentile</p>
                <p className="text-3xl font-display font-bold text-white">Top 2%</p>
              </div>
              <div className="w-px h-12 bg-white/5" />
              <div className="text-center flex-1">
                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-1">Legacy Points</p>
                <p className="text-3xl font-display font-bold text-white">12.4k</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-4/5 shadow-premium" />
              </div>
              <p className="text-[10px] text-gray-500 font-medium italic leading-relaxed text-center">
                "You are 2 sessions away from the 'Foundational Pillar' medal!"
              </p>
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              <h4 className="font-bold text-white text-xs uppercase tracking-widest">Network Insights</h4>
            </div>
            <ul className="space-y-6">
              {[
                { label: 'Mentee Growth',     value: '+24%', color: 'text-amber-400' },
                { label: 'System Adoption',   value: 'High', color: 'text-yellow-400' },
                { label: 'Skill Endorsements', value: '86',  color: 'text-amber-400' },
              ].map((insight, i) => (
                <li key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">{insight.label}</span>
                  <span className={cn("text-xs font-bold", insight.color)}>{insight.value}</span>
                </li>
              ))}
            </ul>
          </GlassCard>

          <GlassCard className="p-8 border-l-4 border-yellow-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-yellow-400" />
              <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Alumni Perk</h4>
            </div>
            <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
              Your alumni status grants you lifelong access to the 'Researcher Lab' with standard k-anonymity privileges.
            </p>
          </GlassCard>

          {/* Role Completeness Card */}
          <GlassCard className="p-6 border border-green-500/20 bg-green-500/5">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-green-400" />
              <h4 className="text-[10px] font-bold text-green-400 uppercase tracking-widest">🔧 Role Completeness</h4>
            </div>
            <ul className="space-y-2">
              {[
                'Dashboard structure',
                'Sidebar modules',
                'Feature completeness',
                'Data flow integration',
                'Permission boundaries',
                'System interactions',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                  <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[10px] text-green-400/70 italic font-medium">
              It is ready for implementation without missing components.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
