import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ─── GLOBAL STYLES ────────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #06080f; font-family: 'DM Sans', sans-serif; }
    input, select, button { font-family: inherit; outline: none; }
    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: #0b0f1e; }
    ::-webkit-scrollbar-thumb { background: #1e3050; border-radius: 3px; }
    input::placeholder { color: #334155; }
    @keyframes fadeSlideIn {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .page-enter { animation: fadeSlideIn 0.3s ease forwards; }
    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(34,211,238,0.3); }
      50%       { box-shadow: 0 0 0 8px rgba(34,211,238,0); }
    }
  `}</style>
);

// ─── MOCK DATA ────────────────────────────────────────────────────
const scoreData = [
  { m: "Sep", s: 65 }, { m: "Oct", s: 72 }, { m: "Nov", s: 68 },
  { m: "Dec", s: 78 }, { m: "Jan", s: 82 }, { m: "Feb", s: 85 }, { m: "Mar", s: 88 },
];
const subjectData = [
  { name: "Math", score: 85 }, { name: "Science", score: 78 },
  { name: "English", score: 92 }, { name: "History", score: 71 }, { name: "Art", score: 95 },
];
const submissions = [
  { id: 1, file: "math_chapter5.pdf",   subject: "Mathematics", score: 88, date: "Mar 14, 2026", feedback: "Clear handwriting, minor spacing issues in lower section." },
  { id: 2, file: "english_essay.pdf",   subject: "English",     score: 92, date: "Mar 12, 2026", feedback: "Excellent structure and letter clarity throughout." },
  { id: 3, file: "science_notes.pdf",   subject: "Science",     score: 76, date: "Mar 10, 2026", feedback: "Good content, work on consistent letter formation." },
  { id: 4, file: "history_hw.pdf",      subject: "History",     score: 71, date: "Mar 8, 2026",  feedback: "Legible but inconsistent letter sizing detected." },
  { id: 5, file: "math_quiz.pdf",       subject: "Mathematics", score: 84, date: "Mar 5, 2026",  feedback: "Well organized and clean presentation." },
  { id: 6, file: "art_theory.pdf",      subject: "Art",         score: 95, date: "Mar 3, 2026",  feedback: "Outstanding clarity and beautiful letterforms." },
];
const students = [
  { id: 1, name: "Arjun Sharma",  email: "arjun@lumina.edu",  avg: 88, subs: 15, trend: "up",     grade: "A"  },
  { id: 2, name: "Priya Patel",   email: "priya@lumina.edu",  avg: 92, subs: 18, trend: "up",     grade: "A+" },
  { id: 3, name: "Rahul Kumar",   email: "rahul@lumina.edu",  avg: 74, subs: 11, trend: "down",   grade: "B"  },
  { id: 4, name: "Ananya Singh",  email: "ananya@lumina.edu", avg: 85, subs: 16, trend: "up",     grade: "A"  },
  { id: 5, name: "Dev Nair",      email: "dev@lumina.edu",    avg: 79, subs: 13, trend: "stable", grade: "B+" },
  { id: 6, name: "Kavya Reddy",   email: "kavya@lumina.edu",  avg: 95, subs: 20, trend: "up",     grade: "A+" },
  { id: 7, name: "Ishaan Mehta",  email: "ishaan@lumina.edu", avg: 68, subs:  9, trend: "down",   grade: "C+" },
  { id: 8, name: "Sneha Gupta",   email: "sneha@lumina.edu",  avg: 88, subs: 17, trend: "up",     grade: "A"  },
];
const classAvgData = [
  { w: "W1", avg: 72 }, { w: "W2", avg: 75 }, { w: "W3", avg: 74 }, { w: "W4", avg: 80 },
  { w: "W5", avg: 82 }, { w: "W6", avg: 85 }, { w: "W7", avg: 83 }, { w: "W8", avg: 88 },
];
const studentNotifs = [
  { id: 1, type: "score",    msg: "Your Math assignment scored 88/100",                       time: "2h ago",  read: false },
  { id: 2, type: "feedback", msg: "Teacher left feedback on your English essay",               time: "1d ago",  read: false },
  { id: 3, type: "assign",   msg: "New assignment: Science Chapter 8 due Mar 20",             time: "2d ago",  read: true  },
  { id: 4, type: "score",    msg: "History homework scored 71/100",                           time: "5d ago",  read: true  },
  { id: 5, type: "system",   msg: "Platform maintenance scheduled for Mar 18",                time: "1w ago",  read: true  },
];
const teacherNotifs = [
  { id: 1, type: "submission", msg: "Priya Patel submitted English Essay — Score: 92",        time: "1h ago",  read: false },
  { id: 2, type: "submission", msg: "Rahul Kumar submitted Science Notes — Score: 74",        time: "3h ago",  read: false },
  { id: 3, type: "alert",      msg: "Ishaan Mehta score dropped below 70 — intervention suggested", time: "1d ago",  read: false },
  { id: 4, type: "system",     msg: "Monthly analytics report is ready for Class 10-A",      time: "2d ago",  read: true  },
  { id: 5, type: "system",     msg: "Platform update: Gemini 2.0 analysis now available",    time: "3d ago",  read: true  },
];
const adminNotifs = [
  { id: 1, type: "alert",   msg: "Server CPU usage exceeded 85% — scale-up recommended",          time: "30m ago", read: false },
  { id: 2, type: "user",    msg: "New teacher account registered: Ms. Deepa Iyer",                time: "2h ago",  read: false },
  { id: 3, type: "system",  msg: "Gemini API quota at 78% for this billing cycle",                time: "5h ago",  read: false },
  { id: 4, type: "report",  msg: "Weekly platform report generated — 412 analyses run",           time: "1d ago",  read: true  },
  { id: 5, type: "user",    msg: "Student Ishaan Mehta flagged for low performance (avg 68)",      time: "1d ago",  read: true  },
  { id: 6, type: "system",  msg: "Prisma DB migration completed successfully",                     time: "3d ago",  read: true  },
];
const allUsers = [
  { id: 1,  name: "Hari Kiran",      role: "student", email: "harikiran1388@gmail.com", class: "10-A", status: "active",   joined: "Jan 2026" },
  { id: 2,  name: "Arjun Sharma",    role: "student", email: "arjun@lumina.edu",         class: "10-A", status: "active",   joined: "Jan 2026" },
  { id: 3,  name: "Priya Patel",     role: "student", email: "priya@lumina.edu",         class: "10-A", status: "active",   joined: "Jan 2026" },
  { id: 4,  name: "Rahul Kumar",     role: "student", email: "rahul@lumina.edu",         class: "10-B", status: "active",   joined: "Jan 2026" },
  { id: 5,  name: "Kavya Reddy",     role: "student", email: "kavya@lumina.edu",         class: "10-A", status: "active",   joined: "Feb 2026" },
  { id: 6,  name: "Ishaan Mehta",    role: "student", email: "ishaan@lumina.edu",        class: "10-B", status: "flagged",  joined: "Jan 2026" },
  { id: 7,  name: "Dr. Anand Kumar", role: "teacher", email: "anand@lumina.edu",         class: "10-A", status: "active",   joined: "Dec 2025" },
  { id: 8,  name: "Ms. Deepa Iyer",  role: "teacher", email: "deepa@lumina.edu",         class: "10-B", status: "pending",  joined: "Mar 2026" },
  { id: 9,  name: "Mr. Ravi Menon",  role: "teacher", email: "ravi@lumina.edu",          class: "9-A",  status: "active",   joined: "Dec 2025" },
  { id: 10, name: "Super Admin",     role: "admin",   email: "admin@lumina.edu",         class: "—",    status: "active",   joined: "Nov 2025" },
];
const classesData = [
  { id: 1, name: "Class 10-A", teacher: "Dr. Anand Kumar", students: 32, avgScore: 83, subjects: 8, active: true  },
  { id: 2, name: "Class 10-B", teacher: "Mr. Ravi Menon",  students: 29, avgScore: 78, subjects: 8, active: true  },
  { id: 3, name: "Class 9-A",  teacher: "Ms. Deepa Iyer",  students: 34, avgScore: 81, subjects: 7, active: true  },
  { id: 4, name: "Class 9-B",  teacher: "Unassigned",       students: 31, avgScore: 0,  subjects: 7, active: false },
];
const platformWeeklyData = [
  { w: "W1", analyses: 48, users: 120 }, { w: "W2", analyses: 62, users: 124 },
  { w: "W3", analyses: 55, users: 127 }, { w: "W4", analyses: 74, users: 130 },
  { w: "W5", analyses: 88, users: 133 }, { w: "W6", analyses: 91, users: 138 },
  { w: "W7", analyses: 85, users: 140 }, { w: "W8", analyses: 104, users: 145 },
];
const apiUsageData = [
  { day: "Mon", calls: 210 }, { day: "Tue", calls: 340 }, { day: "Wed", calls: 290 },
  { day: "Thu", calls: 410 }, { day: "Fri", calls: 385 }, { day: "Sat", calls: 120 }, { day: "Sun", calls: 95 },
];

// ─── SHARED ATOMS ─────────────────────────────────────────────────
const tc = { /* theme colors */
  bg0: "#06080f", bg1: "#0b0f1e", bg2: "#0f1726", bg3: "#111828",
  border: "#1e3050", text: "#e2e8f0", muted: "#64748b", dim: "#334155",
  cyan: "#22d3ee", gold: "#f59e0b", green: "#10b981", red: "#ef4444", violet: "#a78bfa",
};

function ScoreBadge({ score }) {
  const [color, bg] = score >= 80
    ? ["#10b981", "rgba(16,185,129,0.12)"]
    : score >= 60
    ? ["#f59e0b", "rgba(245,158,11,0.12)"]
    : ["#ef4444", "rgba(239,68,68,0.12)"];
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}30`,
      borderRadius: 8, padding: "3px 11px", fontSize: 13, fontWeight: 700,
      fontFamily: "Sora, sans-serif", letterSpacing: "0.02em", whiteSpace: "nowrap",
    }}>{score}</span>
  );
}

function StatCard({ label, value, sub, accent = tc.cyan, icon }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "linear-gradient(135deg, #0f1726 0%, #111f33 100%)",
        border: `1px solid ${hov ? accent + "40" : tc.border}`,
        borderRadius: 16, padding: "22px 24px", position: "relative",
        overflow: "hidden", transition: "all 0.2s",
        transform: hov ? "translateY(-2px)" : "none",
        boxShadow: hov ? `0 8px 32px ${accent}18` : "none",
        cursor: "default",
      }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, width: 90, height: 90,
        background: `radial-gradient(circle at top right, ${accent}18, transparent 70%)`,
        pointerEvents: "none",
      }} />
      <div style={{ fontSize: 26, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: accent, fontFamily: "Sora, sans-serif", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: tc.muted, marginTop: 6, fontFamily: "DM Sans, sans-serif" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: tc.dim, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

const chartTooltipStyle = {
  background: "#111828", border: "1px solid #1e3050",
  borderRadius: 8, color: "#e2e8f0", fontSize: 12,
};

function SectionBox({ title, subtitle, children, action }) {
  return (
    <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: subtitle ? 4 : 20 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: tc.text, fontFamily: "Sora, sans-serif" }}>{title}</span>
        {action && <span style={{ fontSize: 12, color: tc.cyan, cursor: "pointer" }}>{action}</span>}
      </div>
      {subtitle && <div style={{ fontSize: 12, color: tc.muted, marginBottom: 20 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function TableHeader({ cols }) {
  return (
    <tr style={{ background: tc.bg3, borderBottom: `1px solid ${tc.border}` }}>
      {cols.map(c => (
        <th key={c} style={{
          textAlign: "left", padding: "13px 16px", fontSize: 10, color: "#4a6080",
          fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
        }}>{c}</th>
      ))}
    </tr>
  );
}

function ProgressBar({ value, color }) {
  return (
    <div style={{ height: 7, background: "#1e2d4a", borderRadius: 4, overflow: "hidden" }}>
      <div style={{
        height: "100%", borderRadius: 4, width: `${value}%`,
        background: color || (value >= 80 ? "linear-gradient(90deg,#10b981,#34d399)" : value >= 60 ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "linear-gradient(90deg,#ef4444,#f87171)"),
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────
function Sidebar({ items, active, onNav, onLogout, role, userName }) {
  const roleColor = role === "teacher" ? tc.gold : role === "admin" ? tc.violet : tc.cyan;
  return (
    <div style={{
      width: 240, minHeight: "100vh", background: tc.bg1,
      borderRight: `1px solid ${tc.border}`, display: "flex",
      flexDirection: "column", flexShrink: 0, position: "sticky", top: 0,
      backgroundImage: `radial-gradient(ellipse at 50% 0%, ${roleColor}08 0%, transparent 55%)`,
    }}>
      {/* Brand */}
      <div style={{ padding: "20px 20px 18px", borderBottom: `1px solid ${tc.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: `linear-gradient(135deg, ${roleColor}, ${roleColor}80)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0,
          }}>✦</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", lineHeight: 1 }}>Lumina</div>
            <div style={{ fontSize: 9, color: "#4a6080", letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 2 }}>AI Learning Platform</div>
          </div>
        </div>
      </div>

      {/* User chip */}
      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${tc.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `linear-gradient(135deg, ${roleColor}30, ${roleColor}08)`,
            border: `2px solid ${roleColor}30`, display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: roleColor, flexShrink: 0,
          }}>{userName[0]}</div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#cbd5e1", fontFamily: "Sora, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</div>
            <div style={{ fontSize: 9, color: roleColor, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginTop: 1 }}>{role}</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "10px 10px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
        {items.map(item => (
          <button
            key={item.key}
            onClick={() => onNav(item.key)}
            style={{
              display: "flex", alignItems: "center", gap: 11,
              padding: "9px 12px", borderRadius: 10, border: "none",
              cursor: "pointer", width: "100%", textAlign: "left",
              background: active === item.key ? `${roleColor}14` : "transparent",
              color: active === item.key ? roleColor : "#5a7090",
              fontSize: 13.5, fontFamily: "DM Sans, sans-serif",
              fontWeight: active === item.key ? 600 : 400,
              borderLeft: `3px solid ${active === item.key ? roleColor : "transparent"}`,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 17, width: 22, flexShrink: 0, textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && (
              <span style={{
                background: tc.red, color: "#fff", borderRadius: 10,
                padding: "1px 7px", fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div style={{ padding: "10px 10px 16px" }}>
        <button
          onClick={onLogout}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 12px", borderRadius: 10, border: "none",
            cursor: "pointer", background: "rgba(239,68,68,0.07)",
            color: "#ef4444", fontSize: 13.5, fontFamily: "DM Sans, sans-serif",
            width: "100%", transition: "all 0.15s",
          }}
        >
          <span style={{ fontSize: 17 }}>🚪</span> Log out
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  STUDENT PAGES
// ═══════════════════════════════════════════════════════════════════

function StudentHome() {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Good morning, Hari Kiran 👋</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Here's your learning overview for today — Sunday, March 15 2026</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Latest Score"       value="88" sub="Math Chapter 5"      accent={tc.cyan}   icon="📊" />
        <StatCard label="Total Submissions"  value="32" sub="This semester"        accent={tc.gold}   icon="📄" />
        <StatCard label="Average Score"      value="84" sub="+6 from last month"   accent={tc.green}  icon="⭐" />
        <StatCard label="Day Streak"         value="12" sub="Keep it up!"          accent={tc.violet} icon="🔥" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 20 }}>
        <SectionBox title="Score Trend" subtitle="Monthly average — last 7 months">
          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={scoreData}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.cyan} stopOpacity={0.22} />
                  <stop offset="95%" stopColor={tc.cyan} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="m" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="s" stroke={tc.cyan} strokeWidth={2.5} fill="url(#sg)" dot={{ fill: tc.cyan, r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionBox>

        <SectionBox title="By Subject" subtitle="Average score per subject">
          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={subjectData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" horizontal={false} />
              <XAxis type="number" domain={[0,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={58} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="score" fill={tc.gold} radius={[0,6,6,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionBox>
      </div>

      <SectionBox title="Recent Submissions" action="View all →">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader cols={["File", "Subject", "Score", "Date", "AI Feedback"]} /></thead>
          <tbody>
            {submissions.slice(0, 4).map(s => (
              <tr key={s.id}
                style={{ borderBottom: `1px solid ${tc.bg3}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = tc.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#cbd5e1" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span>📄</span> {s.file}
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: tc.muted }}>{s.subject}</td>
                <td style={{ padding: "12px 16px" }}><ScoreBadge score={s.score} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#4a6080" }}>{s.date}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: tc.muted, maxWidth: 220 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.feedback}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionBox>
    </div>
  );
}

function SubmitPage() {
  const [file, setFile]         = useState(null);
  const [subject, setSubject]   = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const subjects = ["Mathematics","English","Science","History","Geography","Art","Computer Science","Physics","Chemistry","Biology"];

  const handleSubmit = () => {
    if (!file || !subject) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setResult({ score: 88, feedback: "Clear handwriting with consistent letterforms. Minor spacing improvements suggested in the middle section." }); }, 2200);
  };

  if (result) return (
    <div className="page-enter" style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 40 }}>
      <div style={{ fontSize: 64, marginBottom: 14 }}>✅</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: tc.green, fontFamily: "Sora, sans-serif", marginBottom: 6 }}>Analysis Complete!</h2>
      <p style={{ color: tc.muted, fontSize: 14, marginBottom: 28 }}>Gemini AI has analysed your submission</p>
      <div style={{
        background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 20,
        padding: "32px 40px", textAlign: "center", minWidth: 340,
      }}>
        <div style={{ fontSize: 56, fontWeight: 900, color: tc.green, fontFamily: "Sora, sans-serif", lineHeight: 1 }}>{result.score}</div>
        <div style={{ fontSize: 13, color: tc.muted, marginBottom: 16 }}>Score out of 100</div>
        <div style={{ height: 1, background: tc.border, marginBottom: 16 }} />
        <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6, fontStyle: "italic" }}>"{result.feedback}"</div>
      </div>
      <button
        onClick={() => { setResult(null); setFile(null); setSubject(""); }}
        style={{
          marginTop: 22, background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.3)",
          borderRadius: 10, padding: "11px 28px", color: tc.cyan, cursor: "pointer",
          fontSize: 14, fontFamily: "Sora, sans-serif", fontWeight: 600,
        }}
      >Submit Another</button>
    </div>
  );

  return (
    <div className="page-enter" style={{ maxWidth: 620, margin: "0 auto" }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Submit Assignment</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 30 }}>Upload your handwritten PDF for AI-powered analysis via Gemini 1.5 Flash</p>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f?.type === "application/pdf") setFile(f); }}
        onClick={() => document.getElementById("lumina-file").click()}
        style={{
          border: `2px dashed ${dragging ? tc.cyan : file ? tc.green : tc.border}`,
          borderRadius: 16, padding: "44px 24px", textAlign: "center", cursor: "pointer",
          background: dragging ? "rgba(34,211,238,0.05)" : file ? "rgba(16,185,129,0.05)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s", marginBottom: 22,
        }}
      >
        <input id="lumina-file" type="file" accept=".pdf" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
        <div style={{ fontSize: 44, marginBottom: 10 }}>{file ? "📎" : "📤"}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: file ? tc.green : "#94a3b8", fontFamily: "Sora, sans-serif", marginBottom: 5 }}>
          {file ? file.name : "Drop your handwritten PDF here"}
        </div>
        <div style={{ fontSize: 12.5, color: "#4a6080" }}>
          {file ? `${(file.size / 1024).toFixed(1)} KB · Ready to analyse` : "or click to browse · PDF only"}
        </div>
      </div>

      {/* Subject grid */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#4a6080", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Select Subject</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)} style={{
              padding: "9px 4px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 12.5,
              background: subject === s ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${subject === s ? "rgba(34,211,238,0.4)" : tc.border}`,
              color: subject === s ? tc.cyan : tc.muted,
              fontFamily: "DM Sans, sans-serif", transition: "all 0.15s",
            }}>{s}</button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!file || !subject || loading}
        style={{
          width: "100%", padding: "15px", borderRadius: 12, border: "none",
          background: !file || !subject ? "#1e2d4a" : loading ? tc.cyan + "cc" : `linear-gradient(135deg, ${tc.cyan}, #0ea5e9)`,
          color: !file || !subject ? "#4a6080" : "#06080f",
          fontSize: 15, fontWeight: 700, fontFamily: "Sora, sans-serif",
          cursor: !file || !subject ? "default" : "pointer", transition: "all 0.2s",
          boxShadow: file && subject ? `0 4px 22px rgba(34,211,238,0.28)` : "none",
          letterSpacing: "0.04em",
        }}
      >
        {loading ? "🔄  Analysing with Gemini AI…" : "✦  Analyse Handwriting"}
      </button>
    </div>
  );
}

function HistoryPage() {
  const [filter, setFilter] = useState("all");
  const allSubjects = ["all", "Mathematics", "English", "Science", "History", "Art"];
  const filtered = filter === "all" ? submissions : submissions.filter(s => s.subject === filter);

  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>My History</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 22 }}>{submissions.length} total submissions this semester</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {allSubjects.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "7px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13,
            background: filter === s ? "rgba(34,211,238,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${filter === s ? "rgba(34,211,238,0.4)" : tc.border}`,
            color: filter === s ? tc.cyan : tc.muted, fontFamily: "DM Sans, sans-serif",
          }}>{s === "all" ? "All Subjects" : s}</button>
        ))}
      </div>

      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader cols={["#", "File", "Subject", "Score", "Date", "AI Feedback"]} /></thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s.id}
                style={{ borderBottom: `1px solid ${tc.bg3}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = tc.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#334155" }}>{i + 1}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>📄</span>
                    <span style={{ fontSize: 13, color: "#cbd5e1" }}>{s.file}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ fontSize: 12, color: tc.muted, background: "rgba(255,255,255,0.04)", padding: "3px 10px", borderRadius: 6 }}>{s.subject}</span>
                </td>
                <td style={{ padding: "13px 16px" }}><ScoreBadge score={s.score} /></td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#4a6080" }}>{s.date}</td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: tc.muted, maxWidth: 240 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.feedback}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProgressPage() {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Progress & Analytics</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Your learning journey — visualised</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <SectionBox title="Score Over Time" subtitle="Monthly average performance">
          <ResponsiveContainer width="100%" height={195}>
            <AreaChart data={scoreData}>
              <defs>
                <linearGradient id="sg3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.green} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={tc.green} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="m" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[50,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="s" stroke={tc.green} strokeWidth={2.5} fill="url(#sg3)" dot={{ fill: tc.green, r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionBox>

        <SectionBox title="Subject Performance" subtitle="Average score per subject">
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={subjectData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="name" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="score" fill={tc.gold} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionBox>
      </div>

      <SectionBox title="Detailed Subject Breakdown">
        {subjectData.map(s => (
          <div key={s.name} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>{s.name}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.score >= 80 ? tc.green : s.score >= 60 ? tc.gold : tc.red }}>{s.score}%</span>
            </div>
            <ProgressBar value={s.score} />
          </div>
        ))}
      </SectionBox>
    </div>
  );
}

function SubjectsPage() {
  const subjects = [
    { name: "Mathematics",     icon: "➕", score: 85, subs: 12, color: tc.cyan   },
    { name: "English",         icon: "📝", score: 92, subs: 14, color: tc.green  },
    { name: "Science",         icon: "🔬", score: 78, subs:  9, color: tc.violet },
    { name: "History",         icon: "📜", score: 71, subs:  7, color: tc.gold   },
    { name: "Geography",       icon: "🌍", score: 83, subs:  8, color: "#38bdf8" },
    { name: "Art",             icon: "🎨", score: 95, subs:  6, color: "#fb7185" },
    { name: "Computer Science",icon: "💻", score: 90, subs: 11, color: "#34d399" },
    { name: "Physics",         icon: "⚛️", score: 77, subs:  8, color: "#c084fc" },
  ];
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Subjects</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>All enrolled subjects and your performance in each</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
        {subjects.map(s => {
          const [hov, setHov] = useState(false);
          return (
            <div key={s.name}
              onMouseEnter={() => setHov(true)}
              onMouseLeave={() => setHov(false)}
              style={{
                background: tc.bg2, border: `1px solid ${hov ? s.color + "50" : tc.border}`,
                borderRadius: 16, padding: "20px", cursor: "pointer",
                transition: "all 0.2s", transform: hov ? "translateY(-2px)" : "none",
                boxShadow: hov ? `0 6px 24px ${s.color}14` : "none",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 3 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#4a6080", marginBottom: 14 }}>{s.subs} submissions</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1 }}><ProgressBar value={s.score} color={s.color} /></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.score}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsPage({ notifs = studentNotifs }) {
  const icons = { score: "📊", feedback: "💬", assign: "📋", submission: "📤", alert: "⚠️", system: "🔔" };
  const unread = notifs.filter(n => !n.read).length;
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Notifications</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 24 }}>{unread} unread notification{unread !== 1 ? "s" : ""}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map(n => (
          <div key={n.id} style={{
            background: n.read ? tc.bg2 : "rgba(34,211,238,0.05)",
            border: `1px solid ${n.read ? tc.border : "rgba(34,211,238,0.2)"}`,
            borderRadius: 12, padding: "15px 20px",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ fontSize: 24, width: 38, textAlign: "center", flexShrink: 0 }}>{icons[n.type] || "🔔"}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: n.read ? "#94a3b8" : tc.text, fontFamily: "DM Sans, sans-serif" }}>{n.msg}</div>
              <div style={{ fontSize: 12, color: "#4a6080", marginTop: 4 }}>{n.time}</div>
            </div>
            {!n.read && <div style={{ width: 8, height: 8, background: tc.cyan, borderRadius: "50%", flexShrink: 0, animation: "pulse-glow 2s infinite" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ role, name, email }) {
  return (
    <div className="page-enter" style={{ maxWidth: 580 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Profile</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Manage your account information</p>

      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, padding: 26, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 24, paddingBottom: 22, borderBottom: `1px solid ${tc.border}` }}>
          <div style={{
            width: 70, height: 70, borderRadius: "50%", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 26, fontWeight: 800,
            background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(34,211,238,0.04))",
            border: "2px solid rgba(34,211,238,0.25)", color: tc.cyan,
          }}>{name[0]}</div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: tc.text, fontFamily: "Sora, sans-serif" }}>{name}</div>
            <div style={{ fontSize: 11, color: tc.cyan, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3, fontWeight: 600 }}>{role} · Lumina AI Learning</div>
          </div>
        </div>

        {[
          { label: "Full Name",         value: name },
          { label: "Email",             value: email },
          { label: "Institution",       value: "Lumina Academy" },
          { label: "Class / Section",   value: role === "teacher" ? "Class 10-A, 10-B" : "Class 10-A" },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, display: "block", marginBottom: 7 }}>{f.label}</label>
            <input
              defaultValue={f.value}
              style={{
                width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${tc.border}`,
                borderRadius: 10, padding: "11px 15px", color: tc.text,
                fontSize: 14, fontFamily: "DM Sans, sans-serif",
              }}
            />
          </div>
        ))}
        <button style={{
          marginTop: 4, background: `linear-gradient(135deg, ${tc.cyan}, #0ea5e9)`,
          border: "none", borderRadius: 10, padding: "11px 28px",
          color: "#06080f", fontSize: 14, fontWeight: 700, fontFamily: "Sora, sans-serif", cursor: "pointer",
        }}>Save Changes</button>
      </div>
    </div>
  );
}

function HelpPage() {
  const faqs = [
    { q: "How do I submit a handwriting assignment?", a: "Go to 'Submit Assignment' in the sidebar, upload your PDF, select the subject, and click Analyse." },
    { q: "What file formats are supported?",          a: "PDF files are currently supported. Multi-page PDFs are analysed page by page." },
    { q: "How is my handwriting scored?",             a: "Google Gemini AI analyses clarity, legibility, spacing, and consistency to generate a score from 0 to 100." },
    { q: "Can I re-submit an assignment?",            a: "Yes. Every submission is saved in your history so you can track improvement over time." },
    { q: "How can I improve my score?",               a: "Focus on consistent letter sizing, proper word spacing, and clear letter formation." },
  ];
  return (
    <div className="page-enter" style={{ maxWidth: 620 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Help & Support</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Frequently asked questions</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 22 }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 12, padding: "17px 22px" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: tc.cyan, marginBottom: 7, fontFamily: "Sora, sans-serif" }}>Q: {f.q}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.65 }}>{f.a}</div>
          </div>
        ))}
      </div>
      <div style={{
        background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.2)",
        borderRadius: 12, padding: 20, textAlign: "center",
      }}>
        <div style={{ fontSize: 13.5, color: "#94a3b8", marginBottom: 6 }}>Still need help? Reach out directly</div>
        <div style={{ fontSize: 14, color: tc.cyan, fontWeight: 600 }}>harikiran1388@gmail.com</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  TEACHER PAGES
// ═══════════════════════════════════════════════════════════════════

function TeacherHome() {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Teacher Dashboard 📚</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Class 10-A overview — March 2026</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Students"   value="32"  sub="2 new this week"        accent={tc.gold}  icon="👥" />
        <StatCard label="Class Average"    value="83"  sub="+5 from last month"      accent={tc.green} icon="📊" />
        <StatCard label="Total Submissions"value="127" sub="This semester"           accent={tc.cyan}  icon="📄" />
        <StatCard label="Need Attention"   value="3"   sub="Below 70 average"        accent={tc.red}   icon="⚠️" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 20 }}>
        <SectionBox title="Class Average Trend" subtitle="Weekly performance across all submissions">
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={classAvgData}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.gold} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={tc.gold} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="w" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="avg" stroke={tc.gold} strokeWidth={2.5} fill="url(#cg)" dot={{ fill: tc.gold, r: 4, strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionBox>

        <SectionBox title="Top Performers" subtitle="Highest average scores">
          {[...students].sort((a,b) => b.avg - a.avg).slice(0,5).map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: tc.gold, flexShrink: 0,
              }}>{s.name[0]}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "#cbd5e1", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#4a6080" }}>{s.subs} submissions</div>
              </div>
              <ScoreBadge score={s.avg} />
            </div>
          ))}
        </SectionBox>
      </div>

      <div style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "20px 24px" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#f87171", fontFamily: "Sora, sans-serif", marginBottom: 14 }}>⚠️ Students Needing Attention</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {students.filter(s => s.avg < 80).slice(0,3).map(s => (
            <div key={s.id} style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 6 }}>{s.name}</div>
              <ScoreBadge score={s.avg} />
              <div style={{ fontSize: 12, color: "#4a6080", marginTop: 8 }}>{s.subs} submissions · {s.trend === "down" ? "↓ declining" : "stable"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StudentsPage() {
  const [search, setSearch] = useState("");
  const filtered = students.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>My Students</h2>
          <p style={{ color: tc.muted, fontSize: 13.5 }}>{students.length} students enrolled in Class 10-A</p>
        </div>
        <input
          placeholder="🔍  Search students…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${tc.border}`,
            borderRadius: 10, padding: "10px 16px", color: tc.text,
            fontSize: 13.5, fontFamily: "DM Sans, sans-serif", width: 220,
          }}
        />
      </div>

      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader cols={["Student", "Email", "Avg Score", "Submissions", "Grade", "Trend"]} /></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id}
                style={{ borderBottom: `1px solid ${tc.bg3}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = tc.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: tc.gold, flexShrink: 0,
                    }}>{s.name[0]}</div>
                    <span style={{ fontSize: 14, color: "#cbd5e1", fontWeight: 500 }}>{s.name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: tc.muted }}>{s.email}</td>
                <td style={{ padding: "13px 16px" }}><ScoreBadge score={s.avg} /></td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#94a3b8" }}>{s.subs}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 700, color: s.grade.startsWith("A") ? tc.green : s.grade.startsWith("B") ? tc.cyan : tc.gold }}>{s.grade}</td>
                <td style={{ padding: "13px 16px", fontSize: 20 }}>
                  {s.trend === "up" ? "📈" : s.trend === "down" ? "📉" : "➡️"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AllSubmissionsPage() {
  const allSubs = students.flatMap(s =>
    submissions.slice(0, 2).map((sub, i) => ({ ...sub, studentName: s.name, key: `${s.id}-${i}` }))
  );
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>All Submissions</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 22 }}>Every submission across all students and subjects</p>

      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader cols={["Student", "File", "Subject", "Score", "Date", "Feedback"]} /></thead>
          <tbody>
            {allSubs.map(s => (
              <tr key={s.key}
                style={{ borderBottom: `1px solid ${tc.bg3}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = tc.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{s.studentName}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span>📄</span><span style={{ fontSize: 13, color: "#94a3b8" }}>{s.file}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: tc.muted }}>{s.subject}</td>
                <td style={{ padding: "12px 16px" }}><ScoreBadge score={s.score} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#4a6080" }}>{s.date}</td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: tc.muted, maxWidth: 200 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.feedback}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ClassAnalyticsPage() {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Class Analytics</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Comprehensive class performance analysis</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <SectionBox title="Weekly Class Average" subtitle="8 weeks of aggregated class data">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={classAvgData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="w" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="avg" stroke={tc.gold} strokeWidth={2.5} dot={{ fill: tc.gold, r: 5, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionBox>

        <SectionBox title="Student Score Distribution" subtitle="Individual average scores comparison">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={students.map(s => ({ name: s.name.split(" ")[0], avg: s.avg }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="name" tick={{ fill: "#4a6080", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0,100]} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="avg" fill={tc.cyan} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionBox>
      </div>

      <SectionBox title="Individual Progress Breakdown">
        {students.map(s => (
          <div key={s.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>{s.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#4a6080" }}>{s.subs} subs</span>
                <ScoreBadge score={s.avg} />
              </div>
            </div>
            <ProgressBar value={s.avg} />
          </div>
        ))}
      </SectionBox>
    </div>
  );
}

function AssignmentsPage() {
  const assignments = [
    { id: 1, title: "Math Chapter 6 — Algebra",         subject: "Mathematics", due: "Mar 20, 2026", submitted: 24, total: 32, status: "active"    },
    { id: 2, title: "English Essay — Climate Change",   subject: "English",     due: "Mar 22, 2026", submitted: 18, total: 32, status: "active"    },
    { id: 3, title: "Science Lab Report",               subject: "Science",     due: "Mar 25, 2026", submitted:  8, total: 32, status: "active"    },
    { id: 4, title: "History Chapter 5 Notes",          subject: "History",     due: "Mar 15, 2026", submitted: 32, total: 32, status: "completed" },
    { id: 5, title: "Art Portfolio Submission",         subject: "Art",         due: "Mar 30, 2026", submitted:  3, total: 32, status: "active"    },
  ];
  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Assignments</h2>
          <p style={{ color: tc.muted, fontSize: 13.5 }}>Manage and track class assignments</p>
        </div>
        <button style={{
          background: `linear-gradient(135deg, ${tc.gold}, #d97706)`,
          border: "none", borderRadius: 10, padding: "10px 20px",
          color: "#06080f", fontSize: 14, fontWeight: 700, fontFamily: "Sora, sans-serif", cursor: "pointer",
        }}>+ New Assignment</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {assignments.map(a => (
          <div key={a.id} style={{
            background: tc.bg2, border: `1px solid ${tc.border}`,
            borderRadius: 16, padding: "18px 24px",
            display: "flex", alignItems: "center", gap: 18,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: tc.text, fontFamily: "Sora, sans-serif" }}>{a.title}</span>
                <span style={{
                  fontSize: 10, padding: "2px 10px", borderRadius: 20, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  background: a.status === "completed" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                  color: a.status === "completed" ? tc.green : tc.gold,
                  border: `1px solid ${a.status === "completed" ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`,
                }}>{a.status}</span>
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                <span style={{ fontSize: 12, color: tc.muted }}>📚 {a.subject}</span>
                <span style={{ fontSize: 12, color: tc.muted }}>📅 Due: {a.due}</span>
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif" }}>
                {a.submitted}<span style={{ fontSize: 13, color: "#4a6080", fontWeight: 400 }}>/{a.total}</span>
              </div>
              <div style={{ fontSize: 11, color: "#4a6080", marginBottom: 6 }}>submitted</div>
              <div style={{ width: 88, height: 6, background: "#1e2d4a", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${(a.submitted / a.total) * 100}%`,
                  background: a.status === "completed" ? tc.green : tc.gold,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="page-enter" style={{ maxWidth: 580 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Settings</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Platform configuration and preferences</p>
      {[
        { title: "AI Analysis Model",        desc: "Model used for handwriting analysis",      type: "select",  options: ["Gemini 1.5 Flash", "Gemini 1.5 Pro", "Local TrOCR"],  val: true },
        { title: "Auto-grade Submissions",   desc: "Automatically run AI when a PDF is uploaded", type: "toggle", val: true },
        { title: "Email Notifications",      desc: "Receive alerts for new submissions",       type: "toggle",  val: true },
        { title: "Low Score Alerts",         desc: "Alert me when a student scores below 70",  type: "toggle",  val: true },
        { title: "Class Section",            desc: "Currently assigned class",                 type: "text",    textVal: "Class 10-A" },
      ].map(s => (
        <div key={s.title} style={{
          background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 12,
          padding: "16px 22px", marginBottom: 10,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 3 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#4a6080" }}>{s.desc}</div>
          </div>
          {s.type === "toggle" && (
            <div style={{ width: 44, height: 24, borderRadius: 12, background: s.val ? tc.gold : "#1e3050", cursor: "pointer", position: "relative", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: s.val ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
            </div>
          )}
          {s.type === "select" && (
            <select style={{ background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "6px 12px", color: tc.text, fontSize: 13 }}>
              {s.options.map(o => <option key={o}>{o}</option>)}
            </select>
          )}
          {s.type === "text" && (
            <input defaultValue={s.textVal} style={{ background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "6px 12px", color: tc.text, fontSize: 13, width: 150 }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════

function LoginScreen({ onLogin }) {
  const [role, setRole]     = useState("student");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    { key: "student", icon: "🎓", label: "Student",  desc: "Submit & track your work" },
    { key: "teacher", icon: "📚", label: "Teacher",  desc: "Grade & analyse class" },
    { key: "admin",   icon: "⚙️", label: "Admin",    desc: "Manage the platform" },
  ];
  const roleColor = role === "teacher" ? tc.gold : role === "admin" ? tc.violet : tc.cyan;

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(role); }, 900);
  };

  return (
    <div style={{
      minHeight: "100vh", background: tc.bg0,
      display: "flex", alignItems: "center", justifyContent: "center",
      backgroundImage: `radial-gradient(ellipse at 20% 50%, rgba(34,211,238,0.06) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.05) 0%, transparent 50%)`,
    }}>
      <div style={{ width: "100%", maxWidth: 460, padding: 24 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 38 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: `rgba(34,211,238,0.07)`, border: "1px solid rgba(34,211,238,0.18)",
            borderRadius: 100, padding: "7px 20px", marginBottom: 22,
          }}>
            <span style={{ color: tc.cyan, fontSize: 14 }}>✦</span>
            <span style={{ fontSize: 12, color: tc.cyan, fontFamily: "Sora, sans-serif", letterSpacing: "0.12em", fontWeight: 700 }}>LUMINA AI LEARNING</span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", lineHeight: 1.1, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: tc.muted, fontSize: 14 }}>Choose your role and sign in to continue</p>
        </div>

        {/* Role selector */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 26 }}>
          {roles.map(r => {
            const rc = r.key === "teacher" ? tc.gold : r.key === "admin" ? tc.violet : tc.cyan;
            return (
              <button key={r.key} onClick={() => setRole(r.key)} style={{
                background: role === r.key ? `rgba(${r.key === "teacher" ? "245,158,11" : r.key === "admin" ? "167,139,250" : "34,211,238"},0.1)` : "rgba(255,255,255,0.03)",
                border: `1px solid ${role === r.key ? rc + "50" : tc.border}`,
                borderRadius: 12, padding: "14px 6px", cursor: "pointer",
                textAlign: "center", transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{r.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: role === r.key ? rc : "#5a7090", fontFamily: "Sora, sans-serif", marginBottom: 2 }}>{r.label}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{r.desc}</div>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {[
            { type: "email",    placeholder: "Email address", value: email, onChange: e => setEmail(e.target.value) },
            { type: "password", placeholder: "Password",      value: pass,  onChange: e => setPass(e.target.value)  },
          ].map(f => (
            <input key={f.type} {...f} style={{
              background: "rgba(255,255,255,0.04)", border: `1px solid ${tc.border}`,
              borderRadius: 11, padding: "13px 17px", color: tc.text,
              fontSize: 14.5, fontFamily: "DM Sans, sans-serif", width: "100%",
            }} />
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "14px", borderRadius: 11, border: "none",
            background: loading
              ? roleColor + "99"
              : `linear-gradient(135deg, ${roleColor}, ${role === "teacher" ? "#b45309" : role === "admin" ? "#7c3aed" : "#0ea5e9"})`,
            color: "#06080f", fontSize: 15, fontWeight: 700, fontFamily: "Sora, sans-serif",
            cursor: loading ? "default" : "pointer", transition: "all 0.2s",
            boxShadow: `0 4px 22px ${roleColor}30`, letterSpacing: "0.04em",
          }}
        >
          {loading ? "Signing in…" : `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
        </button>

        <p style={{ textAlign: "center", marginTop: 18, color: "#1e3050", fontSize: 12 }}>
          Demo preview — click Sign in to explore · No real auth required
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  DASHBOARD WRAPPERS
// ═══════════════════════════════════════════════════════════════════

function StudentDashboard({ onLogout }) {
  const [page, setPage] = useState("home");
  const navItems = [
    { key: "home",          icon: "🏠", label: "Dashboard"        },
    { key: "submit",        icon: "📤", label: "Submit Assignment" },
    { key: "history",       icon: "📋", label: "My History"        },
    { key: "progress",      icon: "📊", label: "My Progress"       },
    { key: "subjects",      icon: "📚", label: "Subjects"          },
    { key: "notifications", icon: "🔔", label: "Notifications", badge: 2 },
    { key: "profile",       icon: "👤", label: "Profile"           },
    { key: "help",          icon: "❓", label: "Help & Support"    },
  ];
  const pages = {
    home:          <StudentHome />,
    submit:        <SubmitPage />,
    history:       <HistoryPage />,
    progress:      <ProgressPage />,
    subjects:      <SubjectsPage />,
    notifications: <NotificationsPage notifs={studentNotifs} />,
    profile:       <ProfilePage role="student" name="Hari Kiran" email="harikiran1388@gmail.com" />,
    help:          <HelpPage />,
  };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tc.bg0 }}>
      <Sidebar items={navItems} active={page} onNav={p => setPage(p)} onLogout={onLogout} role="student" userName="Hari Kiran" />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {pages[page] || pages.home}
      </main>
    </div>
  );
}

function TeacherDashboard({ onLogout }) {
  const [page, setPage] = useState("home");
  const navItems = [
    { key: "home",          icon: "🏠", label: "Dashboard"         },
    { key: "students",      icon: "👥", label: "My Students"        },
    { key: "submissions",   icon: "📋", label: "All Submissions"    },
    { key: "analytics",     icon: "📊", label: "Class Analytics"    },
    { key: "assignments",   icon: "📝", label: "Assignments"        },
    { key: "notifications", icon: "🔔", label: "Notifications", badge: 3 },
    { key: "profile",       icon: "👤", label: "Profile"            },
    { key: "settings",      icon: "⚙️", label: "Settings"           },
  ];
  const pages = {
    home:          <TeacherHome />,
    students:      <StudentsPage />,
    submissions:   <AllSubmissionsPage />,
    analytics:     <ClassAnalyticsPage />,
    assignments:   <AssignmentsPage />,
    notifications: <NotificationsPage notifs={teacherNotifs} />,
    profile:       <ProfilePage role="teacher" name="Dr. Anand Kumar" email="anand@lumina.edu" />,
    settings:      <SettingsPage />,
  };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tc.bg0 }}>
      <Sidebar items={navItems} active={page} onNav={p => setPage(p)} onLogout={onLogout} role="teacher" userName="Dr. Anand Kumar" />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {pages[page] || pages.home}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ADMIN PAGES
// ═══════════════════════════════════════════════════════════════════

function AdminHome() {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Platform Overview ⚙️</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Lumina AI Learning — Admin Control Centre · March 2026</p>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Users"       value="145" sub="10 new this month"   accent={tc.violet} icon="👥" />
        <StatCard label="Total Analyses"    value="412" sub="This billing cycle"  accent={tc.cyan}   icon="🔬" />
        <StatCard label="Active Classes"    value="3"   sub="1 unassigned"        accent={tc.gold}   icon="🏫" />
        <StatCard label="API Quota Used"    value="78%" sub="Gemini 1.5 Flash"    accent={tc.red}    icon="⚡" />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18, marginBottom: 20 }}>
        <SectionBox title="Weekly Platform Activity" subtitle="Analyses run & active users per week">
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={platformWeeklyData}>
              <defs>
                <linearGradient id="ag1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.violet} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={tc.violet} stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={tc.cyan} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={tc.cyan} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="w" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="analyses" name="Analyses" stroke={tc.violet} strokeWidth={2} fill="url(#ag1)" />
              <Area type="monotone" dataKey="users"    name="Users"    stroke={tc.cyan}   strokeWidth={2} fill="url(#ag2)" />
            </AreaChart>
          </ResponsiveContainer>
        </SectionBox>

        <SectionBox title="Daily API Calls" subtitle="Gemini calls — this week">
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={apiUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="day" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="calls" fill={tc.violet} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionBox>
      </div>

      {/* Quick status row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {[
          { label: "Database",         value: "SQLite · 12.4 MB",    status: "healthy", icon: "🗄️"  },
          { label: "ML Service",       value: "FastAPI · Port 9000", status: "offline", icon: "🤖"  },
          { label: "Next.js App",      value: "v16.0.10 · Port 3000",status: "healthy", icon: "🌐"  },
        ].map(s => (
          <div key={s.label} style={{
            background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 14, padding: "18px 20px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: tc.muted }}>{s.value}</div>
            </div>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0,
              background: s.status === "healthy" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: s.status === "healthy" ? tc.green : tc.red,
              border: `1px solid ${s.status === "healthy" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
            }}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersPage() {
  const [search, setSearch]     = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal]   = useState(false);

  const filtered = allUsers.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) &&
    (roleFilter === "all" || u.role === roleFilter)
  );

  const rolePill = (role) => {
    const map = { student: [tc.cyan, "rgba(34,211,238,0.1)"], teacher: [tc.gold, "rgba(245,158,11,0.1)"], admin: [tc.violet, "rgba(167,139,250,0.1)"] };
    const [color, bg] = map[role] || [tc.muted, "transparent"];
    return (
      <span style={{
        background: bg, color, border: `1px solid ${color}30`,
        borderRadius: 20, padding: "2px 11px", fontSize: 11, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.07em",
      }}>{role}</span>
    );
  };
  const statusDot = (status) => {
    const c = status === "active" ? tc.green : status === "pending" ? tc.gold : tc.red;
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: c }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />
      {status}
    </span>;
  };

  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>User Management</h2>
          <p style={{ color: tc.muted, fontSize: 13.5 }}>{allUsers.length} total users · {allUsers.filter(u=>u.role==="student").length} students · {allUsers.filter(u=>u.role==="teacher").length} teachers</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="🔍  Search users…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${tc.border}`, borderRadius: 10, padding: "9px 15px", color: tc.text, fontSize: 13.5, width: 200 }} />
          <button onClick={() => setShowModal(true)} style={{
            background: `linear-gradient(135deg, ${tc.violet}, #7c3aed)`,
            border: "none", borderRadius: 10, padding: "9px 18px",
            color: "#fff", fontSize: 13.5, fontWeight: 700, fontFamily: "Sora, sans-serif", cursor: "pointer",
          }}>+ Add User</button>
        </div>
      </div>

      {/* Role filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all","student","teacher","admin"].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} style={{
            padding: "7px 18px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13,
            background: roleFilter === r ? "rgba(167,139,250,0.1)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${roleFilter === r ? "rgba(167,139,250,0.4)" : tc.border}`,
            color: roleFilter === r ? tc.violet : tc.muted,
          }}>{r === "all" ? "All Roles" : r.charAt(0).toUpperCase() + r.slice(1) + "s"}</button>
        ))}
      </div>

      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader cols={["User", "Role", "Email", "Class", "Status", "Joined", "Actions"]} /></thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}
                style={{ borderBottom: `1px solid ${tc.bg3}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = tc.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: u.role === "teacher" ? "rgba(245,158,11,0.1)" : u.role === "admin" ? "rgba(167,139,250,0.1)" : "rgba(34,211,238,0.1)",
                      border: `1px solid ${u.role === "teacher" ? "rgba(245,158,11,0.2)" : u.role === "admin" ? "rgba(167,139,250,0.2)" : "rgba(34,211,238,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700,
                      color: u.role === "teacher" ? tc.gold : u.role === "admin" ? tc.violet : tc.cyan,
                    }}>{u.name[0]}</div>
                    <span style={{ fontSize: 13.5, color: "#cbd5e1", fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: "13px 16px" }}>{rolePill(u.role)}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: tc.muted }}>{u.email}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#94a3b8" }}>{u.class}</td>
                <td style={{ padding: "13px 16px" }}>{statusDot(u.status)}</td>
                <td style={{ padding: "13px 16px", fontSize: 12, color: "#4a6080" }}>{u.joined}</td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ padding: "4px 12px", borderRadius: 7, border: `1px solid ${tc.border}`, background: "transparent", color: tc.muted, fontSize: 12, cursor: "pointer" }}>Edit</button>
                    {u.status !== "active" && (
                      <button style={{ padding: "4px 12px", borderRadius: 7, border: `1px solid rgba(16,185,129,0.3)`, background: "rgba(16,185,129,0.08)", color: tc.green, fontSize: 12, cursor: "pointer" }}>Approve</button>
                    )}
                    {u.role !== "admin" && (
                      <button style={{ padding: "4px 12px", borderRadius: 7, border: `1px solid rgba(239,68,68,0.3)`, background: "rgba(239,68,68,0.08)", color: tc.red, fontSize: 12, cursor: "pointer" }}>Remove</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(6,8,15,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#0f1726", border: `1px solid ${tc.border}`, borderRadius: 18,
            padding: "32px", width: 420, maxWidth: "90vw",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 20 }}>Add New User</div>
            {[
              { label: "Full Name",  type: "text",     placeholder: "e.g. Rohan Verma" },
              { label: "Email",      type: "email",    placeholder: "user@lumina.edu" },
              { label: "Password",   type: "password", placeholder: "Set initial password" },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} style={{
                  width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${tc.border}`,
                  borderRadius: 9, padding: "11px 14px", color: tc.text, fontSize: 14,
                }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 6 }}>Role</label>
              <select style={{ width: "100%", background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 9, padding: "11px 14px", color: tc.text, fontSize: 14 }}>
                <option>Student</option><option>Teacher</option><option>Admin</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${tc.border}`,
                background: "transparent", color: tc.muted, fontSize: 14, cursor: "pointer",
              }}>Cancel</button>
              <button onClick={() => setShowModal(false)} style={{
                flex: 1, padding: "12px", borderRadius: 10, border: "none",
                background: `linear-gradient(135deg, ${tc.violet}, #7c3aed)`,
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}>Create User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassesPage() {
  const [showModal, setShowModal] = useState(false);
  return (
    <div className="page-enter">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Classes & Subjects</h2>
          <p style={{ color: tc.muted, fontSize: 13.5 }}>{classesData.length} classes · {classesData.filter(c=>c.active).length} active</p>
        </div>
        <button onClick={() => setShowModal(true)} style={{
          background: `linear-gradient(135deg, ${tc.violet}, #7c3aed)`,
          border: "none", borderRadius: 10, padding: "10px 20px",
          color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Sora, sans-serif", cursor: "pointer",
        }}>+ New Class</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16, marginBottom: 28 }}>
        {classesData.map(c => (
          <div key={c.id} style={{
            background: tc.bg2, border: `1px solid ${c.active ? tc.border : "rgba(239,68,68,0.2)"}`,
            borderRadius: 16, padding: "22px 24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: tc.muted }}>👤 {c.teacher}</div>
              </div>
              <span style={{
                fontSize: 11, padding: "3px 11px", borderRadius: 20, fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.07em",
                background: c.active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: c.active ? tc.green : tc.red,
                border: `1px solid ${c.active ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
              }}>{c.active ? "Active" : "Inactive"}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Students",  value: c.students },
                { label: "Subjects",  value: c.subjects  },
                { label: "Avg Score", value: c.active ? c.avgScore : "—" },
              ].map(m => (
                <div key={m.label} style={{ textAlign: "center", background: tc.bg3, borderRadius: 10, padding: "10px 8px" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: tc.violet, fontFamily: "Sora, sans-serif" }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: "#4a6080", marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${tc.border}`, background: "transparent", color: tc.muted, fontSize: 13, cursor: "pointer" }}>Edit</button>
              {!c.active && <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.08)", color: tc.green, fontSize: 13, cursor: "pointer" }}>Activate</button>}
              {c.active  && <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(34,211,238,0.3)", background: "rgba(34,211,238,0.08)", color: tc.cyan, fontSize: 13, cursor: "pointer" }}>View Class</button>}
            </div>
          </div>
        ))}
      </div>

      {/* Subjects list */}
      <SectionBox title="All Subjects on Platform">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {["Mathematics","English","Science","History","Geography","Art","Computer Science","Physics","Chemistry","Biology","Hindi","Economics"].map(s => (
            <span key={s} style={{
              background: "rgba(167,139,250,0.08)", color: tc.violet,
              border: "1px solid rgba(167,139,250,0.2)", borderRadius: 20,
              padding: "6px 16px", fontSize: 13, fontWeight: 500,
            }}>{s}</span>
          ))}
          <button style={{
            background: "transparent", color: tc.muted, border: `1px dashed ${tc.border}`,
            borderRadius: 20, padding: "6px 16px", fontSize: 13, cursor: "pointer",
          }}>+ Add Subject</button>
        </div>
      </SectionBox>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,8,15,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: "#0f1726", border: `1px solid ${tc.border}`, borderRadius: 18, padding: "32px", width: 400 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 20 }}>Create New Class</div>
            {["Class Name", "Section", "Assign Teacher"].map(f => (
              <div key={f} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: "#4a6080", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, display: "block", marginBottom: 6 }}>{f}</label>
                <input placeholder={`Enter ${f.toLowerCase()}`} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${tc.border}`, borderRadius: 9, padding: "11px 14px", color: tc.text, fontSize: 14 }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${tc.border}`, background: "transparent", color: tc.muted, fontSize: 14, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${tc.violet}, #7c3aed)`, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlatformSubmissionsPage() {
  const allSubs = students.flatMap(s =>
    submissions.slice(0, 2).map((sub, i) => ({ ...sub, studentName: s.name, key: `${s.id}-${i}` }))
  );
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>All Submissions</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 22 }}>Every submission across the entire platform</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        <StatCard label="Total Submissions" value={allSubs.length} sub="All time"          accent={tc.violet} icon="📄" />
        <StatCard label="Avg Platform Score" value="82"            sub="Across all classes" accent={tc.green}  icon="📊" />
        <StatCard label="This Week"          value="104"           sub="+14 from last week" accent={tc.cyan}   icon="📅" />
        <StatCard label="Pending Review"     value="8"             sub="Awaiting teacher"   accent={tc.gold}   icon="⏳" />
      </div>
      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 16, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><TableHeader cols={["Student", "File", "Subject", "Score", "Date", "Class", "Feedback"]} /></thead>
          <tbody>
            {allSubs.map(s => (
              <tr key={s.key}
                style={{ borderBottom: `1px solid ${tc.bg3}`, transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = tc.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "12px 16px", fontSize: 13, color: "#cbd5e1", fontWeight: 500 }}>{s.studentName}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}><span>📄</span><span style={{ fontSize: 13, color: "#94a3b8" }}>{s.file}</span></div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: tc.muted }}>{s.subject}</td>
                <td style={{ padding: "12px 16px" }}><ScoreBadge score={s.score} /></td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: "#4a6080" }}>{s.date}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ fontSize: 11, background: "rgba(167,139,250,0.08)", color: tc.violet, border: "1px solid rgba(167,139,250,0.2)", borderRadius: 6, padding: "2px 9px" }}>Class 10-A</span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 12, color: tc.muted, maxWidth: 180 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.feedback}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlatformAnalyticsPage() {
  return (
    <div className="page-enter">
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Platform Analytics</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Full-platform insights — all classes, all users</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <SectionBox title="Platform Activity (8 Weeks)" subtitle="Analyses run vs active users">
          <ResponsiveContainer width="100%" height={195}>
            <LineChart data={platformWeeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="w" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="analyses" name="Analyses" stroke={tc.violet} strokeWidth={2.5} dot={{ fill: tc.violet, r: 4, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="users"    name="Users"    stroke={tc.cyan}   strokeWidth={2.5} dot={{ fill: tc.cyan,   r: 4, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionBox>

        <SectionBox title="API Usage — This Week" subtitle="Gemini 1.5 Flash daily call volume">
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={apiUsageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
              <XAxis dataKey="day" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="calls" fill={tc.violet} radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </SectionBox>
      </div>

      {/* Class performance comparison */}
      <SectionBox title="Class Performance Comparison">
        {classesData.filter(c => c.active).map(c => (
          <div key={c.id} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
              <span style={{ fontSize: 14, color: "#94a3b8" }}>{c.name} — {c.teacher}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#4a6080" }}>{c.students} students</span>
                <ScoreBadge score={c.avgScore} />
              </div>
            </div>
            <ProgressBar value={c.avgScore} color={tc.violet} />
          </div>
        ))}
      </SectionBox>
    </div>
  );
}

function AdminSettingsPage() {
  return (
    <div className="page-enter" style={{ maxWidth: 620 }}>
      <h2 style={{ fontSize: 26, fontWeight: 800, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 4 }}>Platform Settings</h2>
      <p style={{ color: tc.muted, fontSize: 13.5, marginBottom: 28 }}>Global configuration for the Lumina AI Learning platform</p>

      {/* AI Config */}
      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: tc.violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>🤖 AI Configuration</div>
        {[
          { label: "Primary AI Model",      type: "select",  options: ["Gemini 1.5 Flash", "Gemini 1.5 Pro", "Local TrOCR"],  desc: "Model used for handwriting analysis" },
          { label: "Fallback to Local ML",   type: "toggle",  val: false, desc: "Use TrOCR if Gemini API quota is exceeded" },
          { label: "Analysis Prompt Style",  type: "select",  options: ["Standard", "Strict", "Lenient"],                     desc: "Scoring strictness for AI grading" },
          { label: "Max PDF Pages",          type: "text",    textVal: "10",                                                  desc: "Maximum pages to analyse per submission" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${tc.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#4a6080" }}>{s.desc}</div>
            </div>
            {s.type === "toggle" && (
              <div style={{ width: 44, height: 24, borderRadius: 12, background: s.val ? tc.violet : "#1e3050", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: s.val ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white" }} />
              </div>
            )}
            {s.type === "select" && (
              <select style={{ background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "6px 12px", color: tc.text, fontSize: 13 }}>
                {s.options.map(o => <option key={o}>{o}</option>)}
              </select>
            )}
            {s.type === "text" && (
              <input defaultValue={s.textVal} style={{ background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "6px 12px", color: tc.text, fontSize: 13, width: 80, textAlign: "center" }} />
            )}
          </div>
        ))}
      </div>

      {/* System Config */}
      <div style={{ background: tc.bg2, border: `1px solid ${tc.border}`, borderRadius: 14, padding: "20px 24px", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: tc.violet, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>🗄️ System Configuration</div>
        {[
          { label: "Database Engine",       type: "select",  options: ["SQLite (Dev)", "PostgreSQL (Prod)"], desc: "Switch DB for production deployment" },
          { label: "Auto Backups",           type: "toggle",  val: true,  desc: "Daily automated database backups" },
          { label: "Maintenance Mode",       type: "toggle",  val: false, desc: "Block all user logins temporarily" },
          { label: "Rate Limit (req/min)",   type: "text",    textVal: "60",                                 desc: "API rate limit per user session" },
        ].map(s => (
          <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 14, marginBottom: 14, borderBottom: `1px solid ${tc.border}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: tc.text, fontFamily: "Sora, sans-serif", marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#4a6080" }}>{s.desc}</div>
            </div>
            {s.type === "toggle" && (
              <div style={{ width: 44, height: 24, borderRadius: 12, background: s.val ? tc.violet : "#1e3050", cursor: "pointer", position: "relative", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: s.val ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "white" }} />
              </div>
            )}
            {s.type === "select" && (
              <select style={{ background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "6px 12px", color: tc.text, fontSize: 13 }}>
                {s.options.map(o => <option key={o}>{o}</option>)}
              </select>
            )}
            {s.type === "text" && (
              <input defaultValue={s.textVal} style={{ background: tc.bg3, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "6px 12px", color: tc.text, fontSize: 13, width: 80, textAlign: "center" }} />
            )}
          </div>
        ))}
      </div>

      <button style={{
        background: `linear-gradient(135deg, ${tc.violet}, #7c3aed)`,
        border: "none", borderRadius: 10, padding: "12px 32px",
        color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: "Sora, sans-serif", cursor: "pointer",
        boxShadow: `0 4px 20px rgba(167,139,250,0.3)`,
      }}>Save All Settings</button>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  const [page, setPage] = useState("home");
  const navItems = [
    { key: "home",        icon: "🏠", label: "Platform Overview"   },
    { key: "users",       icon: "👥", label: "User Management"     },
    { key: "classes",     icon: "🏫", label: "Classes & Subjects"  },
    { key: "submissions", icon: "📋", label: "All Submissions"     },
    { key: "analytics",   icon: "📊", label: "Platform Analytics"  },
    { key: "notifs",      icon: "🔔", label: "Notifications", badge: 3 },
    { key: "profile",     icon: "👤", label: "Profile"             },
    { key: "settings",    icon: "⚙️", label: "Settings"            },
  ];
  const pages = {
    home:        <AdminHome />,
    users:       <UsersPage />,
    classes:     <ClassesPage />,
    submissions: <PlatformSubmissionsPage />,
    analytics:   <PlatformAnalyticsPage />,
    notifs:      <NotificationsPage notifs={adminNotifs} />,
    profile:     <ProfilePage role="admin" name="Super Admin" email="admin@lumina.edu" />,
    settings:    <AdminSettingsPage />,
  };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: tc.bg0 }}>
      <Sidebar items={navItems} active={page} onNav={p => setPage(p)} onLogout={onLogout} role="admin" userName="Super Admin" />
      <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto", maxHeight: "100vh" }}>
        {pages[page] || pages.home}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
//  ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function LuminaApp() {
  const [screen, setScreen] = useState("login");

  return (
    <>
      <GlobalStyles />
      {screen === "login"   && <LoginScreen    onLogin={role => setScreen(role)} />}
      {screen === "student" && <StudentDashboard onLogout={() => setScreen("login")} />}
      {screen === "teacher" && <TeacherDashboard onLogout={() => setScreen("login")} />}
      {screen === "admin"   && <AdminDashboard   onLogout={() => setScreen("login")} />}
    </>
  );
}
