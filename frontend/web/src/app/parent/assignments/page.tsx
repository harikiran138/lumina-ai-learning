"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
  BookOpen,
  Filter,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const mockAssignments = [
  {
    id: "1",
    title: "Quadratic Equations – Practice Set",
    subject: "Mathematics",
    child: "Alex",
    dueDate: "2024-04-10",
    status: "pending",
    score: null,
  },
  {
    id: "2",
    title: "Newton's Laws – Lab Report",
    subject: "Physics",
    child: "Alex",
    dueDate: "2024-04-05",
    status: "missing",
    score: null,
  },
  {
    id: "3",
    title: "Essay: Industrial Revolution",
    subject: "History",
    child: "Alex",
    dueDate: "2024-03-28",
    status: "submitted",
    score: 85,
  },
  {
    id: "4",
    title: "Cell Division Worksheet",
    subject: "Biology",
    child: "Alex",
    dueDate: "2024-03-25",
    status: "submitted",
    score: 72,
  },
  {
    id: "5",
    title: "Organic Chemistry – Problem Set",
    subject: "Chemistry",
    child: "Alex",
    dueDate: "2024-04-08",
    status: "pending",
    score: null,
  },
]

const statusConfig = {
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock },
  missing: { label: "Missing", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertCircle },
  submitted: { label: "Submitted", color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle },
}

export default function ParentAssignmentsPage() {
  const [filter, setFilter] = useState<"all" | "pending" | "missing" | "submitted">("all")

  const filtered = filter === "all" ? mockAssignments : mockAssignments.filter((a) => a.status === filter)

  const counts = {
    pending: mockAssignments.filter((a) => a.status === "pending").length,
    missing: mockAssignments.filter((a) => a.status === "missing").length,
    submitted: mockAssignments.filter((a) => a.status === "submitted").length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Assignments</h2>
        <p className="text-gray-400 text-sm">Track your child&apos;s assignment submissions and scores.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["pending", "missing", "submitted"] as const).map((status) => {
          const cfg = statusConfig[status]
          const Icon = cfg.icon
          return (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={`p-4 rounded-xl border text-left transition-all ${cfg.bg} ${cfg.border} hover:opacity-80 ${filter === status ? "ring-1 ring-lumina-highlight" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${cfg.color}`} />
                <span className={`text-sm font-semibold capitalize ${cfg.color}`}>{status}</span>
              </div>
              <p className="text-2xl font-bold text-white">{counts[status]}</p>
            </button>
          )
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-gray-500" />
        {(["all", "pending", "missing", "submitted"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
              filter === f
                ? "bg-lumina-highlight text-black"
                : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {filtered.map((assignment, idx) => {
          const cfg = statusConfig[assignment.status as keyof typeof statusConfig]
          const Icon = cfg.icon
          const overdue = assignment.status === "missing"

          return (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{assignment.title}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {assignment.subject} · {assignment.child}
                    </p>
                    <p className={`text-xs mt-1 ${overdue ? "text-red-400" : "text-gray-500"}`}>
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      {overdue && " — Overdue"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge className={`${cfg.bg} ${cfg.color} border ${cfg.border} text-[10px] px-2 flex items-center gap-1`}>
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
                  {assignment.score !== null && (
                    <span className="text-sm font-bold text-lumina-highlight">{assignment.score}%</span>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}

        {filtered.length === 0 && (
          <div className="bg-white/5 border border-dashed border-white/10 p-10 rounded-xl text-center">
            <ClipboardList className="h-7 w-7 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No assignments found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
