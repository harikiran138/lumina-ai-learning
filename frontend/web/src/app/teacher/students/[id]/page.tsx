"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Target,
  MessageSquare,
  FileText,
  BarChart3,
  Search,
  Filter,
  Download,
  MoreVertical,
  Activity,
  Zap,
  Sparkles
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: string;
  courses: Array<{
    id: string;
    name: string;
    progress: number;
    mastery: number;
    lastAccessed: string;
  }>;
  stats: {
    overallProgress: number;
    overallMastery: number;
    assignmentsCompleted: number;
    assignmentsTotal: number;
    averageScore: number;
    streak: number;
    totalTime: number;
  };
  recentActivity: Array<{
    id: string;
    type: "lesson" | "assignment" | "quiz";
    title: string;
    course: string;
    timestamp: string;
    score?: number;
  }>;
  weakTopics: string[];
  strongTopics: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  lastActive: string;
}

const EMPTY_STUDENT: StudentDetail = {
  id: "",
  name: "",
  email: "",
  avatar: "",
  joinedAt: "",
  courses: [],
  stats: {
    overallProgress: 0,
    overallMastery: 0,
    assignmentsCompleted: 0,
    assignmentsTotal: 0,
    averageScore: 0,
    streak: 0,
    totalTime: 0,
  },
  recentActivity: [],
  weakTopics: [],
  strongTopics: [],
  riskLevel: "low",
  lastActive: "",
};

function ProgressRing({
  value,
  size = 120,
  strokeWidth = 8,
  color = "amber",
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: "amber" | "yellow" | "amber" | "red";
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const colors = {
    amber: "text-amber-400",
    yellow: "text-yellow-400",
    gold: "text-lumina-highlight",
    red: "text-red-400",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000", colors[color])}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-2xl font-bold", colors[color])}>{value}%</span>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  subtext,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="glass-v2 border-white/5 p-6 rounded-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1">{label}</p>
          <h3 className="text-2xl font-display font-bold text-white">{value}</h3>
        </div>
        <div className="p-2.5 rounded-xl bg-white/5 text-amber-400">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {subtext && <p className="mt-4 text-[10px] font-bold text-gray-700 uppercase tracking-widest">{subtext}</p>}
    </div>
  );
}

export default function StudentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [student, setStudent] = useState<StudentDetail>(EMPTY_STUDENT);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "topics">("overview");

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const loadStudentData = async () => {
    setIsLoading(true);
    try {
      // Fetch student profile and progress data
      const [profileData, progressData] = await Promise.all([
        api.getPersonalizationProfile(id),
        api.getStudentProgress(),
      ]);

      // Transform the data
      const studentData: StudentDetail = {
        id: id,
        name: profileData?.name || "Student",
        email: profileData?.email || "",
        avatar:
          profileData?.avatar ||
          `https://ui-avatars.com/api/?name=${profileData?.name || "S"}&background=random`,
        joinedAt: profileData?.created_at || new Date().toISOString(),
        courses: progressData?.recentCourses?.map((c: any) => ({
          id: c.id,
          name: c.courseName,
          progress: c.progress,
          mastery: c.mastery,
          lastAccessed: new Date().toISOString(),
        })) || [],
        stats: {
          overallProgress: Math.round(progressData?.overallMastery || 0),
          overallMastery: Math.round(profileData?.overall_mastery * 100 || 0),
          assignmentsCompleted: progressData?.stats?.assignmentsCompleted || 0,
          assignmentsTotal: 10,
          averageScore: Math.round(profileData?.overall_mastery * 100 || 0),
          streak: progressData?.stats?.currentStreak || 0,
          totalTime: 24,
        },
        recentActivity: [
          {
            id: "1",
            type: "lesson",
            title: "Completed Introduction to Calculus",
            course: "Mathematics 101",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "2",
            type: "assignment",
            title: "Submitted Assignment: Derivatives",
            course: "Mathematics 101",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
            score: 85,
          },
        ],
        weakTopics: profileData?.weak_topics || [],
        strongTopics: profileData?.strong_topics || [],
        riskLevel: profileData?.risk_summary?.risk_level || "low",
        lastActive: profileData?.last_active || new Date().toISOString(),
      };

      setStudent(studentData);
    } catch (error) {
      console.error("Failed to load student data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500" />
      </div>
    );
  }

  const riskColors = {
    low: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]",
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-6">
          <Link 
            href="/teacher/students"
            className="mt-2 p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-display font-bold text-white tracking-tight uppercase">
                {student.name}
              </h1>
              <span className={cn(
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border",
                riskColors[student.riskLevel]
              )}>
                {student.riskLevel} Risk
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-bold uppercase tracking-widest">
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined {new Date(student.joinedAt).toLocaleDateString()}</span>
              <div className="h-1 w-1 rounded-full bg-gray-800" />
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {student.email}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition-all">
            <MessageSquare className="h-4 w-4" />
            Message Parent
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_20px_rgba(251,191,36,0.2)]">
            <Sparkles className="h-4 w-4" />
            Gen. Intervention
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-4">
        <StatTile
          icon={Target}
          label="Overall Progress"
          value={`${student.stats.overallProgress}%`}
          subtext="Course completion"
        />
        <StatTile
          icon={Award}
          label="Mastery Score"
          value={`${student.stats.overallMastery}%`}
          subtext="Avg vs concept goal"
        />
        <StatTile
          icon={FileText}
          label="Assignments"
          value={`${student.stats.assignmentsCompleted}/${student.stats.assignmentsTotal}`}
          subtext={`${student.stats.averageScore}% average`}
        />
        <StatTile
          icon={TrendingUp}
          label="Engagement"
          value={`${student.stats.streak}d`}
          subtext="Current streak"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
           <section className="glass-v2 border-white/5 rounded-3xl overflow-hidden">
             <div className="border-b border-white/5 flex">
               {(["overview", "activity", "topics"] as const).map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "px-8 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
                      activeTab === tab ? "text-amber-400" : "text-gray-500 hover:text-white"
                    )}
                 >
                   {tab}
                   {activeTab === tab && (
                     <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                   )}
                 </button>
               ))}
             </div>
             <div className="p-8">
               {activeTab === "overview" && (
                 <div className="space-y-8">
                   <h3 className="text-xl font-bold text-white uppercase tracking-tight">Performance Overview</h3>
                   <div className="flex flex-col items-center justify-center p-8 bg-white/[0.01] rounded-2xl border border-white/5">
                      <ProgressRing
                        value={student.stats.overallMastery}
                        color={student.stats.overallMastery >= 70 ? "yellow" : "amber"}
                      />
                      <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Mastery Index</p>
                   </div>
                   <div className="space-y-6">
                      {student.courses.map((course) => (
                        <div key={course.id} className="p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-white uppercase text-sm tracking-tight">{course.name}</p>
                            <span className="text-amber-400 font-bold text-sm">{course.mastery}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400/50" style={{ width: `${course.progress}%` }} />
                          </div>
                        </div>
                      ))}
                   </div>
                 </div>
               )}
               {activeTab === "activity" && (
                 <div className="space-y-6">
                   {student.recentActivity.map((act) => (
                     <div key={act.id} className="flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:bg-white/5 transition-all">
                       <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-amber-400">
                          {act.type === "lesson" && <BookOpen className="h-5 w-5" />}
                          {act.type === "assignment" && <FileText className="h-5 w-5" />}
                          {act.type === "quiz" && <Target className="h-5 w-5" />}
                       </div>
                       <div className="flex-1">
                         <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white uppercase">{act.title}</p>
                            <span className="text-[10px] text-gray-700 font-bold uppercase">{new Date(act.timestamp).toLocaleDateString()}</span>
                         </div>
                         <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{act.course} {act.score && `• Score: ${act.score}%`}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
               {activeTab === "topics" && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <section className="glass-v2 border-white/5 p-8 rounded-3xl bg-yellow-500/[0.02]">
                      <h3 className="text-sm font-bold text-white mb-6 uppercase flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-400" />
                        Strengths
                      </h3>
                      <div className="space-y-3">
                        {student.strongTopics.map((topic) => (
                          <div key={topic} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                            <CheckCircle className="h-4 w-4 text-yellow-400" />
                            <span className="text-[10px] font-bold text-gray-300 uppercase">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                    <section className="glass-v2 border-white/5 p-8 rounded-3xl bg-red-500/[0.02]">
                      <h3 className="text-sm font-bold text-white mb-6 uppercase flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Frictions
                      </h3>
                      <div className="space-y-3">
                        {student.weakTopics.map((topic) => (
                          <div key={topic} className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-[10px] font-bold text-gray-300 uppercase">{topic}</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
               )}
             </div>
           </section>
        </div>

        <div className="space-y-6">
          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-[14px] font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Sparkles className="h-4 w-4 text-amber-400" />
              AI Diagnosis
            </h3>
            <div className="p-4 rounded-2xl bg-amber-400/5 border border-amber-400/10 space-y-4">
              <p className="text-xs text-amber-200/80 leading-relaxed italic">
                "{student.name}'s performance pattern suggests high cognitive load in abstract modeling sections. Intervention recommended."
              </p>
              <div className="h-px bg-amber-400/20" />
              <button className="w-full py-2.5 rounded-xl bg-amber-400 text-black text-[10px] font-bold hover:bg-amber-300 transition-all uppercase tracking-widest">
                Deploy Pathway Adjust
              </button>
            </div>
          </section>

          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
             <h3 className="text-sm font-bold text-white mb-6 uppercase flex items-center justify-between">
               Contact Student
               <MoreVertical className="h-4 w-4 text-gray-600" />
             </h3>
             <div className="space-y-6">
                <button className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                  <Mail className="h-4 w-4" />
                  Send Email
                </button>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
