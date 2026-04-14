"use client"

import { motion } from "framer-motion"
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  BarChart2,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

const sessions = [
  { id: "1", date: "2024-04-01", subject: "Mathematics", duration: "45 min", attended: true, participation: 92 },
  { id: "2", date: "2024-04-01", subject: "Physics", duration: "45 min", attended: true, participation: 68 },
  { id: "3", date: "2024-03-29", subject: "Chemistry", duration: "45 min", attended: false, participation: 0 },
  { id: "4", date: "2024-03-28", subject: "English", duration: "45 min", attended: true, participation: 85 },
  { id: "5", date: "2024-03-27", subject: "Biology", duration: "45 min", attended: true, participation: 55 },
  { id: "6", date: "2024-03-26", subject: "History", duration: "45 min", attended: false, participation: 0 },
  { id: "7", date: "2024-03-25", subject: "Mathematics", duration: "45 min", attended: true, participation: 88 },
  { id: "8", date: "2024-03-22", subject: "Physics", duration: "45 min", attended: true, participation: 71 },
]

export default function ParentAttendancePage() {
  const attended = sessions.filter((s) => s.attended).length
  const total = sessions.length
  const attendanceRate = Math.round((attended / total) * 100)
  const avgParticipation = Math.round(
    sessions.filter((s) => s.attended).reduce((acc, s) => acc + s.participation, 0) / attended
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Attendance</h2>
        <p className="text-gray-400 text-sm">Monitor your child&apos;s session attendance and participation score.</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-lumina-highlight" />
            <span className="text-xs text-gray-400">Attendance Rate</span>
          </div>
          <p className="text-3xl font-bold text-lumina-highlight">{attendanceRate}%</p>
          <p className="text-xs text-gray-500 mt-1">{attended} of {total} sessions</p>
          <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${attendanceRate}%` }}
              className="h-full bg-lumina-highlight rounded-full"
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart2 className="h-4 w-4 text-green-400" />
            <span className="text-xs text-gray-400">Avg Participation</span>
          </div>
          <p className="text-3xl font-bold text-green-400">{avgParticipation}%</p>
          <p className="text-xs text-gray-500 mt-1">Across attended sessions</p>
          <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${avgParticipation}%` }}
              className="h-full bg-green-500 rounded-full"
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-4 w-4 text-red-400" />
            <span className="text-xs text-gray-400">Absences</span>
          </div>
          <p className="text-3xl font-bold text-red-400">{total - attended}</p>
          <p className="text-xs text-gray-500 mt-1">Sessions missed</p>
          {total - attended >= 2 && (
            <Badge className="mt-2 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">
              ⚠ Attention needed
            </Badge>
          )}
        </div>
      </div>

      {/* Session Log */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400" />
          Session Log
        </h3>

        <div className="space-y-2">
          {sessions.map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="flex items-center gap-4 p-3 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all"
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                session.attended ? "bg-green-500/10" : "bg-red-500/10"
              }`}>
                {session.attended
                  ? <CheckCircle className="h-4 w-4 text-green-400" />
                  : <XCircle className="h-4 w-4 text-red-400" />
                }
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{session.subject}</p>
                <p className="text-xs text-gray-500">
                  {new Date(session.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  &nbsp;·&nbsp;{session.duration}
                </p>
              </div>

              <div className="text-right shrink-0">
                {session.attended ? (
                  <>
                    <p className="text-xs text-gray-400">Participation</p>
                    <p className={`text-sm font-bold ${session.participation >= 75 ? "text-green-400" : "text-yellow-400"}`}>
                      {session.participation}%
                    </p>
                  </>
                ) : (
                  <Badge className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px]">Absent</Badge>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
