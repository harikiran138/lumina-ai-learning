"use client"

import { motion } from "framer-motion"
import {
  FileText,
  TrendingUp,
  TrendingDown,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Calendar,
  BarChart2,
  Lightbulb,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const weeklyReports = [
  {
    id: "1",
    week: "March 25 – March 31, 2024",
    current: true,
    summary: "Overall mastery improved by 3% this week. Mathematics showed strong gains. Physics and Biology still require attention.",
    topicsCount: 8,
    sessionsAttended: 5,
    sessionsTotal: 6,
    subjectChanges: [
      { subject: "Mathematics", change: +12, mastery: 78 },
      { subject: "English", change: +5, mastery: 88 },
      { subject: "Chemistry", change: +3, mastery: 65 },
      { subject: "Physics", change: -5, mastery: 42 },
      { subject: "Biology", change: -3, mastery: 39 },
    ],
    recommendations: [
      "Schedule additional Physics study time (3× per week).",
      "Review Biology notes with child over the weekend.",
      "Praise Mathematics improvement to reinforce positive behavior.",
    ],
  },
  {
    id: "2",
    week: "March 18 – March 24, 2024",
    current: false,
    summary: "A steady week with minor improvements across most subjects. Some gaps identified in Physics and Biology.",
    topicsCount: 7,
    sessionsAttended: 6,
    sessionsTotal: 6,
    subjectChanges: [
      { subject: "Mathematics", change: +4, mastery: 66 },
      { subject: "English", change: +2, mastery: 83 },
      { subject: "Chemistry", change: -1, mastery: 62 },
      { subject: "Physics", change: -2, mastery: 47 },
      { subject: "Biology", change: +1, mastery: 42 },
    ],
    recommendations: [
      "Encourage consistent daily study habits.",
      "Discuss Physics concepts during dinner conversations.",
    ],
  },
]

export default function ParentWeeklyReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Weekly Reports</h2>
        <p className="text-gray-400 text-sm">Auto-generated weekly summaries of your child&apos;s academic performance.</p>
      </div>

      {weeklyReports.map((report, reportIdx) => (
        <motion.section
          key={report.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reportIdx * 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Report Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-lumina-highlight/10 border border-lumina-highlight/20 flex items-center justify-center">
                <FileText className="h-4 w-4 text-lumina-highlight" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{report.week}</h3>
                  {report.current && (
                    <Badge className="bg-lumina-highlight/20 text-lumina-highlight border border-lumina-highlight/30 text-[10px]">
                      Current
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{report.topicsCount} topics covered</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>{report.sessionsAttended}/{report.sessionsTotal} sessions</span>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-6">
            {/* Summary */}
            <div>
              <p className="text-sm text-gray-300 leading-relaxed">{report.summary}</p>
            </div>

            {/* Subject Changes */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <BarChart2 className="h-3.5 w-3.5 text-lumina-highlight" />
                Subject Performance Changes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.subjectChanges.map((sub) => (
                  <div
                    key={sub.subject}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl"
                  >
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      sub.change >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    }`}>
                      {sub.change >= 0
                        ? <TrendingUp className="h-4 w-4 text-green-400" />
                        : <TrendingDown className="h-4 w-4 text-red-400" />
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{sub.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${sub.mastery < 45 ? "bg-red-500" : "bg-lumina-highlight"}`}
                            style={{ width: `${sub.mastery}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold shrink-0 ${sub.mastery < 45 ? "text-red-400" : "text-lumina-highlight"}`}>
                          {sub.mastery}%
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-bold shrink-0 ${sub.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {sub.change > 0 ? "+" : ""}{sub.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-3 flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                Recommended Actions
              </h4>
              <div className="space-y-2">
                {report.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="h-3.5 w-3.5 text-lumina-highlight shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>
      ))}
    </div>
  )
}
