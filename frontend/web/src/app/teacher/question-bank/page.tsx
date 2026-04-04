"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Filter,
  BookOpen,
  BarChart3,
  CheckCircle,
  Edit2,
  Trash2,
  Tag,
  ChevronDown,
  ArrowRight,
  Sparkles,
  FileText,
  Star,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Difficulty = "easy" | "medium" | "hard";
type BloomLevel =
  | "Remember"
  | "Understand"
  | "Apply"
  | "Analyze"
  | "Evaluate"
  | "Create";
type Source = "ai-generated" | "manual" | "student-query";

interface Question {
  id: string;
  text: string;
  courseTitle: string;
  topicName: string;
  difficulty: Difficulty;
  bloom: BloomLevel;
  source: Source;
  verified: boolean;
  modelAnswer: string;
  rubric?: string;
  timesUsed: number;
  avgScore?: number;
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    text: "Explain the bias-variance tradeoff and how it affects model selection.",
    courseTitle: "Introduction to Machine Learning",
    topicName: "Model Evaluation",
    difficulty: "hard",
    bloom: "Analyze",
    source: "manual",
    verified: true,
    modelAnswer:
      "Bias refers to errors from overly simplistic assumptions in the learning algorithm. Variance refers to errors from sensitivity to small fluctuations in the training set. High bias → underfitting; high variance → overfitting. The tradeoff means reducing one often increases the other.",
    rubric: "4 marks: definition (1), examples (1), tradeoff explanation (1), model selection implication (1)",
    timesUsed: 12,
    avgScore: 71,
  },
  {
    id: "q2",
    text: "What is cross-validation and why is it used?",
    courseTitle: "Introduction to Machine Learning",
    topicName: "Model Evaluation",
    difficulty: "medium",
    bloom: "Understand",
    source: "ai-generated",
    verified: true,
    modelAnswer:
      "Cross-validation is a technique to evaluate model performance by splitting the dataset into k folds, training on k-1 folds and testing on 1, repeating k times. It reduces overfitting to a single train/test split.",
    timesUsed: 8,
    avgScore: 84,
  },
  {
    id: "q3",
    text: "List three activation functions used in neural networks and state their use cases.",
    courseTitle: "Deep Learning Essentials",
    topicName: "Neural Networks",
    difficulty: "medium",
    bloom: "Remember",
    source: "ai-generated",
    verified: false,
    modelAnswer:
      "ReLU: hidden layers, avoids vanishing gradient. Sigmoid: binary output layers. Softmax: multi-class output layers.",
    timesUsed: 0,
  },
  {
    id: "q4",
    text: "Design a neural network architecture for image classification on CIFAR-10. Justify your choices.",
    courseTitle: "Deep Learning Essentials",
    topicName: "CNN Architectures",
    difficulty: "hard",
    bloom: "Create",
    source: "manual",
    verified: true,
    modelAnswer:
      "Expected: convolutional layers for feature extraction, pooling for spatial reduction, batch normalization, dropout for regularization, softmax output for 10 classes. Justification should address feature hierarchy and overfitting control.",
    rubric: "10 marks: architecture diagram (3), layer justification (3), training strategy (2), evaluation plan (2)",
    timesUsed: 4,
    avgScore: 62,
  },
  {
    id: "q5",
    text: "What is a convolutional layer and how does it differ from a fully connected layer?",
    courseTitle: "Deep Learning Essentials",
    topicName: "CNN Architectures",
    difficulty: "easy",
    bloom: "Understand",
    source: "student-query",
    verified: true,
    modelAnswer:
      "A convolutional layer applies learned filters across the input using shared weights, preserving spatial relationships. A fully connected layer connects every input neuron to every output neuron, with no weight sharing.",
    timesUsed: 15,
    avgScore: 88,
  },
];

const difficultyColors: Record<Difficulty, string> = {
  easy: "border-green-400/20 bg-green-400/10 text-green-300",
  medium: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  hard: "border-red-400/20 bg-red-400/10 text-red-300",
};

const bloomColors: Record<BloomLevel, string> = {
  Remember: "text-blue-300",
  Understand: "text-cyan-300",
  Apply: "text-teal-300",
  Analyze: "text-amber-300",
  Evaluate: "text-orange-300",
  Create: "text-lumina-highlight",
};

const sourceLabels: Record<Source, string> = {
  "ai-generated": "AI Generated",
  manual: "Manual",
  "student-query": "From Student",
};

export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState<Difficulty | "all">("all");
  const [filterBloom, setFilterBloom] = useState<BloomLevel | "all">("all");
  const [filterVerified, setFilterVerified] = useState<"all" | "verified" | "unverified">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const bloomLevels: BloomLevel[] = [
    "Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create",
  ];

  const filtered = questions.filter((q) => {
    const matchSearch =
      !search ||
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      q.topicName.toLowerCase().includes(search.toLowerCase()) ||
      q.courseTitle.toLowerCase().includes(search.toLowerCase());
    const matchDiff = filterDiff === "all" || q.difficulty === filterDiff;
    const matchBloom = filterBloom === "all" || q.bloom === filterBloom;
    const matchVerified =
      filterVerified === "all" ||
      (filterVerified === "verified" ? q.verified : !q.verified);
    return matchSearch && matchDiff && matchBloom && matchVerified;
  });

  const toggleVerify = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, verified: !q.verified } : q)),
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="p-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-lumina-highlight">
            Long-Term Intelligence
          </p>
          <h1 className="text-4xl font-display font-bold tracking-tight text-white md:text-5xl">
            Question{" "}
            <span className="text-lumina-highlight border-b-4 border-lumina-highlight/30">
              Bank Authority
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-400 leading-relaxed">
            Your complete question repository — AI-generated, manually created,
            and sourced from student queries. Every question tagged with
            difficulty and Bloom&apos;s taxonomy level.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Total Questions</p>
              <p className="mt-2 text-4xl font-bold text-white">{questions.length}</p>
            </div>
            <div className="rounded-2xl border border-lumina-highlight/20 bg-lumina-highlight/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Verified</p>
              <p className="mt-2 text-4xl font-bold text-lumina-highlight">
                {questions.filter((q) => q.verified).length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">Pending Verification</p>
              <p className="mt-2 text-4xl font-bold text-amber-300">
                {questions.filter((q) => !q.verified).length}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-400/20 bg-blue-400/5 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-gray-500">AI Generated</p>
              <p className="mt-2 text-4xl font-bold text-blue-300">
                {questions.filter((q) => q.source === "ai-generated").length}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/faculty/ai-generator"
              className="inline-flex items-center gap-2 rounded-xl border border-lumina-highlight/30 bg-lumina-highlight/10 px-4 py-2.5 text-sm font-semibold text-lumina-highlight hover:bg-lumina-highlight/20 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Generate with AI
            </Link>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <Plus className="h-4 w-4" />
              Add Manual Question
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors">
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>
      </section>

      {/* Bloom's taxonomy distribution */}
      <section className="glass-v2 border-white/5 overflow-hidden">
        <div className="border-b border-white/5 p-6">
          <h2 className="text-lg font-display font-bold text-white">
            Bloom&apos;s Taxonomy Distribution
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Ensure your question bank covers all cognitive levels.
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {bloomLevels.map((level) => {
              const count = questions.filter((q) => q.bloom === level).length;
              const pct = Math.round((count / questions.length) * 100);
              return (
                <div
                  key={level}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center"
                >
                  <p className={cn("text-sm font-bold", bloomColors[level])}>
                    {level}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-white">{count}</p>
                  <p className="mt-1 text-xs text-gray-500">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search questions, topics, courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-lumina-highlight/50 focus:outline-none"
          />
        </div>

        <select
          value={filterDiff}
          onChange={(e) => setFilterDiff(e.target.value as Difficulty | "all")}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
        >
          <option value="all">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <select
          value={filterBloom}
          onChange={(e) => setFilterBloom(e.target.value as BloomLevel | "all")}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
        >
          <option value="all">All Bloom Levels</option>
          {bloomLevels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value as "all" | "verified" | "unverified")}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:outline-none"
        >
          <option value="all">All Status</option>
          <option value="verified">Verified Only</option>
          <option value="unverified">Needs Verification</option>
        </select>
      </div>

      <p className="text-sm text-gray-500">
        Showing {filtered.length} of {questions.length} questions
      </p>

      {/* Question list */}
      <div className="space-y-4">
        {filtered.map((q) => {
          const isExpanded = expandedId === q.id;
          return (
            <div
              key={q.id}
              className={cn(
                "rounded-3xl border bg-white/[0.03] transition-all",
                q.verified ? "border-white/10" : "border-amber-400/20",
              )}
            >
              <div
                className="flex cursor-pointer items-start justify-between gap-4 p-6"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em]",
                        difficultyColors[q.difficulty],
                      )}
                    >
                      {q.difficulty}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold",
                        bloomColors[q.bloom],
                      )}
                    >
                      {q.bloom}
                    </span>
                    <span className="text-xs text-gray-600">
                      • {sourceLabels[q.source]}
                    </span>
                    {!q.verified && (
                      <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                        Needs Verification
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">{q.text}</p>
                  <p className="text-xs text-gray-500">
                    {q.courseTitle} • {q.topicName}
                    {q.timesUsed > 0 && ` • Used ${q.timesUsed}× `}
                    {q.avgScore != null && ` • Avg score: ${q.avgScore}%`}
                  </p>
                </div>
                <div className="shrink-0 text-gray-500 hover:text-white">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 rotate-180" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-white/5 p-6 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                      Model Answer
                    </p>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 text-sm leading-relaxed text-gray-200">
                      {q.modelAnswer}
                    </div>
                  </div>

                  {q.rubric && (
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
                        Marking Rubric
                      </p>
                      <div className="rounded-2xl border border-lumina-highlight/10 bg-lumina-highlight/5 px-5 py-4 text-sm text-gray-300">
                        {q.rubric}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => toggleVerify(q.id)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
                        q.verified
                          ? "border-white/10 text-gray-400 hover:text-white"
                          : "border-lumina-highlight/30 bg-lumina-highlight/10 text-lumina-highlight hover:bg-lumina-highlight/20",
                      )}
                    >
                      <CheckCircle className="h-4 w-4" />
                      {q.verified ? "Unverify" : "Verify Question"}
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
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
