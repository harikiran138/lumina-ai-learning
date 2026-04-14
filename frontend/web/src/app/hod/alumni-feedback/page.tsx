"use client";

import { Star, TrendingDown, TrendingUp, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const ALUMNI_FEEDBACK = [
  {
    topic: "Machine Learning",
    relevanceScore: 91,
    industry: "Data Science & AI",
    responses: 142,
    trend: "up",
    feedback: "Highly relevant. Students recommend adding more hands-on project work and real datasets.",
    hodDecision: "Increase lab sessions by 2 per week. Add Kaggle project to curriculum.",
    decisionStatus: "implemented",
  },
  {
    topic: "Web Technologies",
    relevanceScore: 87,
    industry: "Product & SaaS",
    responses: 98,
    trend: "up",
    feedback: "Very useful. Alumni recommend adding TypeScript, React, and modern API design patterns.",
    hodDecision: "Add TypeScript module and React framework track in Semester 6.",
    decisionStatus: "in-progress",
  },
  {
    topic: "Cloud Computing",
    relevanceScore: 83,
    industry: "Cloud & DevOps",
    responses: 77,
    trend: "up",
    feedback: "Foundational, but needs more AWS/GCP hands-on. Theory is sufficient.",
    hodDecision: "Partner with AWS Educate for lab credits.",
    decisionStatus: "pending",
  },
  {
    topic: "Database Design",
    relevanceScore: 72,
    industry: "Backend & Data Engineering",
    responses: 110,
    trend: "stable",
    feedback: "Useful, but SQL focus too narrow. Alumni suggest NoSQL (MongoDB) and query optimization.",
    hodDecision: "Add NoSQL module and performance tuning sessions.",
    decisionStatus: "pending",
  },
  {
    topic: "Thermodynamics",
    relevanceScore: 44,
    industry: "Core Mechanical Engineering",
    responses: 63,
    trend: "down",
    feedback: "Too theory-heavy, outdated case studies. Industry applications not covered.",
    hodDecision: "Review with curriculum committee. Introduce industry case studies from 2020+.",
    decisionStatus: "in-progress",
  },
  {
    topic: "Operating Systems",
    relevanceScore: 38,
    industry: "Systems & Cloud",
    responses: 89,
    trend: "down",
    feedback: "Very theoretical. Alumni say real-world application is not taught. Missing Docker, VMs, containers.",
    hodDecision: "Introduce containerization and virtualization as a 4-week practical module.",
    decisionStatus: "pending",
  },
];

const DECISION_STYLES = {
  implemented: "text-green-400 bg-green-500/10 border-green-500/20",
  "in-progress": "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  pending:      "text-gray-400 bg-white/5 border-white/10",
};

function RelevanceBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-green-500" : value >= 55 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mt-2">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export default function AlumniFeedbackPage() {
  const highRelevance = ALUMNI_FEEDBACK.filter(f => f.relevanceScore >= 75).length;
  const lowRelevance = ALUMNI_FEEDBACK.filter(f => f.relevanceScore < 55).length;
  const totalResponses = ALUMNI_FEEDBACK.reduce((a, f) => a + f.responses, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="glass-v2 border-white/5 p-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-2xl bg-lumina-highlight/10 p-4 border border-lumina-highlight/20 text-lumina-highlight">
            <Star className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">Curriculum Intelligence</p>
            <h1 className="text-3xl font-display font-bold text-white">Alumni Feedback Integration</h1>
          </div>
        </div>
        <p className="text-gray-400 leading-relaxed max-w-3xl">
          HOD receives <strong className="text-white">industry relevance scores</strong> from alumni surveys, showing how useful each subject was
          in their careers. This drives curriculum decisions — updating focus areas, removing outdated content, and adding industry-aligned modules.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{highRelevance}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-green-400 mt-1">High Relevance (≥75%)</p>
        </div>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{lowRelevance}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">Low Relevance (&lt;55%)</p>
        </div>
        <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/5 p-5 text-center">
          <p className="text-3xl font-display font-bold text-white">{totalResponses}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-lumina-highlight mt-1">Alumni Responses</p>
        </div>
      </div>

      {/* Feedback Rows */}
      <div className="space-y-4">
        {ALUMNI_FEEDBACK.sort((a, b) => b.relevanceScore - a.relevanceScore).map((f) => (
          <div key={f.topic} className="glass-v2 border-white/5 p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-white">{f.topic}</h3>
                  {f.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : f.trend === "down" ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : null}
                </div>
                <p className="text-xs text-gray-400">{f.industry} · {f.responses} responses</p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "text-3xl font-display font-bold",
                  f.relevanceScore >= 75 ? "text-green-400" : f.relevanceScore >= 55 ? "text-yellow-400" : "text-red-400"
                )}>
                  {f.relevanceScore}%
                </p>
                <p className="text-xs text-gray-500">relevance</p>
              </div>
            </div>

            <RelevanceBar value={f.relevanceScore} />

            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Alumni Feedback</p>
                <p className="text-sm text-gray-300 italic">"{f.feedback}"</p>
              </div>
              <div className={cn("rounded-xl border p-4", f.decisionStatus === "implemented" ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10")}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">HOD Decision</p>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", DECISION_STYLES[f.decisionStatus as keyof typeof DECISION_STYLES])}>
                    {f.decisionStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-300 flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 shrink-0 text-lumina-highlight mt-0.5" />
                  {f.hodDecision}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
