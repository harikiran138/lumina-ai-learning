"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GitBranch,
  Plus,
  ArrowRight,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  ChevronDown,
  TrendingUp,
  Users,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  name: string;
  courseTitle: string;
  prerequisites: string[];
  studentMastery: number;
  studentCount: number;
  atRisk: number;
  description: string;
  conceptTags: string[];
}

interface ConceptRelationship {
  from: string;
  to: string;
  type: "prerequisite" | "related" | "extends";
}

const MOCK_TOPICS: Topic[] = [
  {
    id: "t1",
    name: "Linear Algebra Basics",
    courseTitle: "Introduction to Machine Learning",
    prerequisites: [],
    studentMastery: 82,
    studentCount: 34,
    atRisk: 3,
    description: "Vectors, matrices, dot products, eigenvalues — foundational math for ML.",
    conceptTags: ["vectors", "matrices", "eigenvectors", "dot product"],
  },
  {
    id: "t2",
    name: "Probability & Statistics",
    courseTitle: "Introduction to Machine Learning",
    prerequisites: ["Linear Algebra Basics"],
    studentMastery: 74,
    studentCount: 34,
    atRisk: 6,
    description: "Distributions, expectation, conditional probability, Bayes theorem.",
    conceptTags: ["probability", "distributions", "bayes", "expectation"],
  },
  {
    id: "t3",
    name: "Supervised Learning",
    courseTitle: "Introduction to Machine Learning",
    prerequisites: ["Linear Algebra Basics", "Probability & Statistics"],
    studentMastery: 68,
    studentCount: 34,
    atRisk: 8,
    description: "Regression, classification, decision trees, SVMs, evaluation metrics.",
    conceptTags: ["regression", "classification", "SVM", "decision tree"],
  },
  {
    id: "t4",
    name: "Neural Network Basics",
    courseTitle: "Deep Learning Essentials",
    prerequisites: ["Supervised Learning"],
    studentMastery: 61,
    studentCount: 28,
    atRisk: 10,
    description: "Perceptrons, activation functions, backpropagation, weight initialization.",
    conceptTags: ["perceptron", "activation", "backprop", "weights"],
  },
  {
    id: "t5",
    name: "CNN Architectures",
    courseTitle: "Deep Learning Essentials",
    prerequisites: ["Neural Network Basics"],
    studentMastery: 55,
    studentCount: 28,
    atRisk: 12,
    description: "Convolutional layers, pooling, batch normalization, ResNet, VGG.",
    conceptTags: ["convolution", "pooling", "ResNet", "VGG"],
  },
];

const MOCK_RELATIONSHIPS: ConceptRelationship[] = [
  { from: "Linear Algebra Basics", to: "Probability & Statistics", type: "prerequisite" },
  { from: "Probability & Statistics", to: "Supervised Learning", type: "prerequisite" },
  { from: "Linear Algebra Basics", to: "Supervised Learning", type: "prerequisite" },
  { from: "Supervised Learning", to: "Neural Network Basics", type: "prerequisite" },
  { from: "Neural Network Basics", to: "CNN Architectures", type: "prerequisite" },
];

export default function KnowledgeGraphPage() {
  const [topics, setTopics] = useState<Topic[]>(MOCK_TOPICS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  const courses = Array.from(new Set(topics.map((t) => t.courseTitle)));

  const filtered =
    selectedCourse === "all"
      ? topics
      : topics.filter((t) => t.courseTitle === selectedCourse);

  const overallMastery = Math.round(
    topics.reduce((acc, t) => acc + t.studentMastery, 0) / topics.length,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            Adaptive Learning Engine
          </p>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
            Knowledge{" "}
            <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">
              Graph Control
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-400 leading-relaxed">
            Define topics, set prerequisite chains, and tag concept relationships.
            This graph drives adaptive learning paths, AI tutoring, and student
            progression for your courses.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Topics Defined</p>
              <p className="mt-2 text-4xl font-bold text-white">{topics.length}</p>
            </div>
            <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Avg Mastery</p>
              <p className="mt-2 text-4xl font-bold text-lumina-highlight">{overallMastery}%</p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Relationships</p>
              <p className="mt-2 text-4xl font-bold text-amber-300">{MOCK_RELATIONSHIPS.length}</p>
            </div>
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Students At Risk</p>
              <p className="mt-2 text-4xl font-bold text-red-300">
                {topics.reduce((acc, t) => acc + t.atRisk, 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-4 py-2.5 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors">
              <Plus className="h-4 w-4" />
              Add Topic
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <GitBranch className="h-4 w-4" />
              Add Relationship
            </button>
          </div>
        </div>
      </section>

      {/* Info banner */}
      <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 px-6 py-4 flex items-start gap-4">
        <GitBranch className="h-5 w-5 text-blue-300 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-300">
          <span className="font-semibold text-blue-300">How it works: </span>
          Topics and prerequisite chains you define here directly control how the AI tutor
          sequences content, which learning paths students follow, and how the system
          identifies gaps. Keep this graph up to date for best results.
        </p>
      </div>

      {/* Prerequisite chain visual */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="border-b border-white/5 p-6">
          <h2 className="text-lg font-display font-bold text-white">Prerequisite Chain</h2>
          <p className="mt-1 text-sm text-gray-400">
            Topic dependency graph — students must master each node before advancing.
          </p>
        </div>
        <div className="p-6 overflow-x-auto">
          <div className="flex items-center gap-2 flex-wrap min-w-max">
            {MOCK_RELATIONSHIPS.map((rel, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white whitespace-nowrap">
                  {rel.from}
                </div>
                <ArrowRight className="h-4 w-4 text-lumina-highlight shrink-0" />
                {i === MOCK_RELATIONSHIPS.length - 1 && (
                  <div className="rounded-xl border border-lumina-highlight/20 bg-lumina-highlight/5 px-3 py-2 text-xs font-semibold text-lumina-highlight whitespace-nowrap">
                    {rel.to}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
        >
          <option value="all">All Courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500">
          {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Topic cards */}
      <div className="space-y-4">
        {filtered.map((topic) => {
          const isExpanded = expandedId === topic.id;
          const masteryColor =
            topic.studentMastery >= 80
              ? "text-lumina-highlight"
              : topic.studentMastery >= 60
                ? "text-amber-300"
                : "text-red-300";

          return (
            <div
              key={topic.id}
              className="rounded-3xl border border-white/10 bg-white/[0.03] transition-all"
            >
              <div
                className="flex cursor-pointer items-start justify-between gap-4 p-6"
                onClick={() => setExpandedId(isExpanded ? null : topic.id)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <p className="text-xs text-gray-500">{topic.courseTitle}</p>
                  <p className="text-base font-semibold text-white">{topic.name}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className={cn("font-bold", masteryColor)}>
                      {topic.studentMastery}% mastery
                    </span>
                    <span className="text-gray-500 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {topic.studentCount} students
                    </span>
                    {topic.atRisk > 0 && (
                      <span className="flex items-center gap-1 text-red-400 text-xs">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {topic.atRisk} at risk
                      </span>
                    )}
                  </div>
                  {topic.prerequisites.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Prerequisites:{" "}
                      <span className="text-gray-300">
                        {topic.prerequisites.join(", ")}
                      </span>
                    </p>
                  )}
                </div>

                {/* Mastery bar */}
                <div className="hidden md:block shrink-0 w-32">
                  <div className="h-2 rounded-full bg-white/10">
                    <div
                      className={cn(
                        "h-2 rounded-full",
                        topic.studentMastery >= 80
                          ? "bg-lumina-highlight"
                          : topic.studentMastery >= 60
                            ? "bg-amber-400"
                            : "bg-red-400",
                      )}
                      style={{ width: `${topic.studentMastery}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs text-gray-500">
                    {topic.studentMastery}%
                  </p>
                </div>

                <div className="shrink-0 text-gray-500 hover:text-white">
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      isExpanded && "rotate-180",
                    )}
                  />
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 p-6 space-y-4">
                  <p className="text-sm text-gray-300">{topic.description}</p>

                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                      Concept Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {topic.conceptTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                      <Edit2 className="h-4 w-4" />
                      Edit Topic
                    </button>
                    <Link
                      href="/faculty/students"
                      className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/20 bg-lumina-highlight/5 px-4 py-2 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/10 transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      View At-Risk Students
                    </Link>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-400/10 transition-colors">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
