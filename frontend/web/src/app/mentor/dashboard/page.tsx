"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  MessageSquare,
  Star,
  ChevronRight,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  Clock,
  BookOpen,
  Target,
  BarChart2,
  ShieldCheck,
  FileText,
  Heart,
  GraduationCap,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { ClientOnlyChart } from "@/components/charts/ClientOnlyChart";
import Link from "next/link";
import { useAuthStore } from "@/store/useAuthStore";

const sessionTrendData = [
  { month: "Jan", sessions: 8 },
  { month: "Feb", sessions: 12 },
  { month: "Mar", sessions: 15 },
  { month: "Apr", sessions: 18 },
  { month: "May", sessions: 14 },
  { month: "Jun", sessions: 20 },
];

const GlassCard: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className,
  children,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
    className={cn(
      "rounded-3xl border border-border bg-surface-elevated backdrop-blur-2xl shadow-sm overflow-hidden",
      className
    )}
  >
    {children}
  </motion.div>
);

const overviewCards = [
  {
    label: "Active Mentees",
    value: "12",
    delta: "+3 this semester",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Sessions This Month",
    value: "18",
    delta: "+5 vs last month",
    icon: Calendar,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    label: "Avg. Satisfaction",
    value: "4.9★",
    delta: "Top 5% this semester",
    icon: Star,
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
  },
  {
    label: "Skill Progress Rate",
    value: "42%",
    delta: "Faster than avg.",
    icon: TrendingUp,
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

const pendingReviews = [
  {
    id: 1,
    name: "Arjun Sharma",
    topic: "Deep Learning Project Report",
    time: "2h ago",
    type: "Portfolio",
  },
  {
    id: 2,
    name: "Divya R.",
    topic: "Resume — Software Engineer Role",
    time: "5h ago",
    type: "Career",
  },
  {
    id: 3,
    name: "Karan M.",
    topic: "Capstone Project: NLP Chatbot",
    time: "Yesterday",
    type: "Technical",
  },
];

const upcomingSessions = [
  {
    id: 1,
    mentee: "Priya K.",
    topic: "Interview Preparation",
    time: "2:00 PM",
    date: "Today",
  },
  {
    id: 2,
    mentee: "Ravi T.",
    topic: "Open Source Contributions",
    time: "11:00 AM",
    date: "Tomorrow",
  },
  {
    id: 3,
    mentee: "Sneha P.",
    topic: "System Design Fundamentals",
    time: "4:00 PM",
    date: "Fri, Apr 19",
  },
];

export default function MentorDashboard() {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }
    api
      .getMentorMatches()
      .then((m) => setMatches(m || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 pb-12 text-foreground">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            <Heart className="w-3 h-3 animate-pulse" />
            Peer Mentor Portal
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground tracking-tight">
            Welcome back,{" "}
            <span className="gradient-text">
              {user?.name?.split(" ")[0] || "Mentor"}
            </span>
          </h1>
          <p className="text-text-secondary mt-1 font-medium">
            Guide peers · build trust · earn your verified certificate
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/mentor/sessions">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-elevated border border-border text-foreground hover:text-primary font-bold text-sm transition-all">
              <Calendar className="w-4 h-4" />
              Schedule Session
            </button>
          </Link>
          <Link href="/mentor/matches">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:scale-105 transition-all shadow-lg">
              <Plus className="w-4 h-4" />
              Find Mentees
            </button>
          </Link>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {overviewCards.map((card) => (
          <GlassCard key={card.label} className="p-6">
            <div className={cn("p-2.5 rounded-xl w-fit mb-4", card.bg, card.color)}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">
              {card.value}
            </p>
            <p className="text-[11px] font-bold text-text-muted mt-1 uppercase tracking-wider">
              {card.label}
            </p>
            <p className="text-[10px] text-text-muted/60 mt-0.5">{card.delta}</p>
          </GlassCard>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Pending Reviews */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10">
                  <FileText className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Pending Reviews
                  </h2>
                  <p className="text-xs text-text-muted">
                    Mentee submissions awaiting your feedback
                  </p>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold">
                {pendingReviews.length} PENDING
              </span>
            </div>
            <div className="space-y-4">
              {pendingReviews.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-primary/20 hover:bg-surface-elevated transition-all group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center font-bold text-primary text-sm shrink-0">
                    {item.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-foreground truncate">
                      {item.topic}
                    </h5>
                    <p className="text-[10px] text-text-muted font-medium mt-0.5">
                      {item.name} · {item.time}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-text-muted text-[10px] font-bold border border-border shrink-0">
                    {item.type}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-primary text-primary-foreground transition-all shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Mentee Matches */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-primary/10">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  Active Mentees
                </h2>
              </div>
              <Link
                href="/mentor/matches"
                className="text-xs font-bold text-primary hover:underline uppercase tracking-tighter"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : matches.length > 0 ? (
                matches.slice(0, 3).map((mentee) => (
                  <div
                    key={mentee.id}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-surface border border-border hover:bg-surface-elevated hover:border-primary/20 transition-all group"
                  >
                    <img
                      src={
                        mentee.avatar ||
                        `https://ui-avatars.com/api/?name=${mentee.name}&background=random`
                      }
                      className="w-12 h-12 rounded-full object-cover border-2 border-border"
                      alt={mentee.name}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground truncate">
                        {mentee.name}
                      </h4>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {(mentee.skills || ["Python", "DSA"]).map((s: string) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-md bg-surface-elevated text-[10px] text-text-muted font-bold border border-border"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 justify-end mb-1">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-lg font-bold text-foreground">
                          {mentee.alignmentScore || "92"}%
                        </span>
                      </div>
                      <p className="text-[10px] text-text-muted font-bold uppercase tracking-tight">
                        Mastery
                      </p>
                    </div>
                    <button className="p-2 rounded-xl bg-surface hover:bg-primary/10 hover:text-primary transition-all ml-2">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-text-muted bg-surface rounded-2xl border border-border border-dashed">
                  <Users className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">
                    No active mentees yet. Browse matches!
                  </p>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Quick Actions */}
          <GlassCard className="p-8">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  label: "Schedule Session",
                  href: "/mentor/sessions",
                  icon: Calendar,
                  color: "bg-primary/10 text-primary",
                },
                {
                  label: "Review Submissions",
                  href: "/mentor/reviews",
                  icon: FileText,
                  color: "bg-amber-500/10 text-amber-400",
                },
                {
                  label: "Message Mentee",
                  href: "/mentor/matches",
                  icon: MessageSquare,
                  color: "bg-green-500/10 text-green-400",
                },
                {
                  label: "Track Progress",
                  href: "/mentor/matches",
                  icon: BarChart2,
                  color: "bg-purple-500/10 text-purple-400",
                },
              ].map((action) => (
                <Link key={action.label} href={action.href}>
                  <button className="w-full flex items-center gap-4 p-5 rounded-2xl bg-surface border border-border hover:border-primary/20 hover:bg-surface-elevated transition-all group">
                    <div className={cn("p-2.5 rounded-xl", action.color)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {action.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-text-muted group-hover:text-primary ml-auto transition-colors" />
                  </button>
                </Link>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── Right Panel ── */}
        <div className="space-y-8">
          {/* Upcoming Sessions */}
          <GlassCard className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-primary/10">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Upcoming Sessions
              </h2>
            </div>
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                      {session.time}
                    </span>
                    <span className="text-[10px] text-text-muted font-bold">
                      {session.date}
                    </span>
                  </div>
                  <h4 className="font-bold text-foreground text-sm mb-1 truncate">
                    {session.topic}
                  </h4>
                  <p className="text-xs text-text-muted flex items-center gap-1.5 font-medium">
                    <Users className="w-3 h-3" /> {session.mentee}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/mentor/sessions">
              <button className="w-full mt-5 py-3 rounded-2xl bg-surface border border-border text-xs font-bold text-foreground hover:border-primary/20 hover:text-primary transition-all uppercase tracking-widest">
                View Full Calendar
              </button>
            </Link>
          </GlassCard>

          {/* Session Trend Chart */}
          <GlassCard className="p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Session Trend
              </h2>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div className="h-40">
              <ClientOnlyChart>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sessionTrendData}>
                    <defs>
                      <linearGradient
                        id="colorMentorSessions"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" hide />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="p-2 rounded-lg bg-surface border border-border text-[10px] font-bold text-foreground">
                            {payload[0].value} Sessions
                          </div>
                        ) : null
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorMentorSessions)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ClientOnlyChart>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">
                  87
                </span>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Total Sessions
                </span>
              </div>
              <p className="text-xs text-text-muted mt-1">
                +22% growth this semester
              </p>
            </div>
          </GlassCard>

          {/* Mentor Impact Badge */}
          <GlassCard className="p-8 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="font-bold text-foreground">Mentor Standing</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-5">
              You are in the top{" "}
              <span className="text-foreground font-bold">5%</span> of mentors
              this semester. Your mentees show a{" "}
              <span className="text-primary font-bold">42%</span> faster skill
              acquisition rate.
            </p>
            <div className="space-y-2 mb-5">
              {[
                { label: "Sessions Completed", val: "87", pct: 87 },
                { label: "Avg. Session Rating", val: "4.9★", pct: 98 },
                { label: "Response Rate", val: "100%", pct: 100 },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-text-muted">{m.label}</span>
                    <span className="text-foreground">{m.val}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${m.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Link href="/mentor/reviews">
              <button className="w-full py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-surface hover:text-primary transition-colors uppercase tracking-widest">
                View Full Insights
              </button>
            </Link>
          </GlassCard>
        </div>
      </div>

      {/* ── Role Verification Banner ── */}
      <GlassCard className="p-8 bg-gradient-to-r from-primary/5 via-transparent to-transparent border border-primary/10">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="p-4 rounded-2xl bg-primary/10 w-fit">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground mb-1">
              🎓 Peer Mentor Role — Lumina Verified
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">
              This role is fully integrated with the Lumina system. Your
              activity directly benefits peers and feeds into the collaborative
              knowledge graph.
            </p>
            <div className="flex flex-wrap gap-3 mt-4">
              {[
                "Dashboard ✅",
                "Mentee Matching ✅",
                "Session Booking ✅",
                "Review Queue ✅",
                "Progress Tracking ✅",
                "Impact Insights ✅",
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Role Status
            </p>
            <p className="text-2xl font-bold text-primary mt-1">ACTIVE</p>
            <p className="text-[10px] text-text-muted mt-1">
              Fully operational
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
