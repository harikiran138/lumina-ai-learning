"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
type ActiveRole = "student" | "faculty" | "admin";

// ── Constants ──────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electronics & Communication Engineering",
  "Electrical & Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
  "Chemical Engineering",
];

const DEMO_ACCOUNTS = {
  student: [
    { initials: "PS", name: "Priya Sharma",    roleLabel: "Student · CSE", identifier: "22NU1A0519",           password: "student@123" },
    { initials: "RK", name: "Rahul Kumar",     roleLabel: "Student · ECE", identifier: "23NU1A0234",           password: "student@123" },
  ],
  faculty: [
    { initials: "AR", name: "Dr. Anand Rao",   roleLabel: "Faculty · CSE", identifier: "FAC001",              password: "faculty@123" },
    { initials: "MD", name: "Prof. Meena Devi",roleLabel: "Faculty · EEE", identifier: "FAC042",              password: "faculty@123" },
  ],
  admin: [
    { initials: "VR", name: "Vijay Reddy",     roleLabel: "College Admin",       identifier: "admin@demo.nsrit.edu.in",  password: "admin@123" },
    { initials: "KS", name: "Dr. K. Srinivas", roleLabel: "Head of Department",  identifier: "hod001@demo.nsrit.edu.in", password: "admin@123" },
  ],
};

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    title: "AI-Powered Learning",
    desc: "8 adaptive styles per learner profile",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </svg>
    ),
    title: "Smart Assessments",
    desc: "Auto-graded with AI rubric feedback",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Real-time Analytics",
    desc: "Live performance dashboards per batch",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Privacy First",
    desc: "On-premise & FERPA compliant hosting",
  },
];

const STATS = [
  { value: "11", label: "User Roles" },
  { value: "52", label: "DB Tables" },
  { value: "8",  label: "AI Styles"  },
  { value: "196",label: "Tests"      },
];

// ── Circuit Board SVG ──────────────────────────────────────────────────────────
function CircuitBoardSVG() {
  const nodes = [
    { cx: 80,  cy: 100, delay: "0s"   },
    { cx: 160, cy: 100, delay: "0.7s" },
    { cx: 320, cy: 100, delay: "0.3s" },
    { cx: 80,  cy: 200, delay: "1.5s" },
    { cx: 240, cy: 200, delay: "1.2s" },
    { cx: 400, cy: 200, delay: "0.9s" },
    { cx: 160, cy: 300, delay: "0.4s" },
    { cx: 320, cy: 300, delay: "1.8s" },
    { cx: 80,  cy: 400, delay: "0.6s" },
    { cx: 240, cy: 400, delay: "1.1s" },
    { cx: 400, cy: 400, delay: "0.2s" },
    { cx: 160, cy: 500, delay: "1.4s" },
    { cx: 320, cy: 500, delay: "0.8s" },
    { cx: 80,  cy: 600, delay: "1.7s" },
    { cx: 240, cy: 600, delay: "0.5s" },
    { cx: 400, cy: 600, delay: "1.0s" },
  ];

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 480 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Grid traces */}
      {[100, 200, 300, 400, 500, 600].map((y) => (
        <line key={`h${y}`} x1="0" y1={y} x2="480" y2={y}
          stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.12" />
      ))}
      {[80, 160, 240, 320, 400].map((x) => (
        <line key={`v${x}`} x1={x} y1="0" x2={x} y2="700"
          stroke="#f59e0b" strokeWidth="0.5" strokeOpacity="0.12" />
      ))}

      {/* Highlight traces */}
      <line x1="0"   y1="200" x2="480" y2="200" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.22" />
      <line x1="0"   y1="400" x2="480" y2="400" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.22" />
      <line x1="160" y1="0"   x2="160" y2="700" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.22" />
      <line x1="320" y1="0"   x2="320" y2="700" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.22" />

      {/* Right-angle circuit trace paths */}
      <path d="M0,150 H120 V100 H200 V150 H360 V200 H480"
        stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.18" fill="none" />
      <path d="M0,350 H80 V300 H200 V350 H280 V300 H400 V350 H480"
        stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.18" fill="none" />
      <path d="M120,0 V80 H200 V140 H120 V250 H80 V350 H120 V450 H200 V550 H120 V700"
        stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.18" fill="none" />
      <path d="M280,0 V60 H360 V140 H280 V240 H400 V340 H280 V440 H360 V540 H280 V700"
        stroke="#f59e0b" strokeWidth="0.8" strokeOpacity="0.14" fill="none" />

      {/* Pulsing nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.cx} cy={n.cy} r="6" fill="none" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.18">
            <animate attributeName="r"             values="6;14;6"       dur="3s" begin={n.delay} repeatCount="indefinite" />
            <animate attributeName="stroke-opacity" values="0.18;0;0.18" dur="3s" begin={n.delay} repeatCount="indefinite" />
          </circle>
          <circle cx={n.cx} cy={n.cy} r="3" fill="#f59e0b">
            <animate attributeName="opacity" values="0.3;0.9;0.3" dur="3s" begin={n.delay} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </svg>
  );
}

// ── Left Panel ─────────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] relative flex-col bg-[#0d0d14] border-r border-white/[0.06] overflow-hidden flex-shrink-0">
      <CircuitBoardSVG />

      <div className="relative z-10 flex flex-col h-full p-8 xl:p-10">
        {/* Logo + badge */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black bg-gradient-to-r from-lumina-primary to-lumina-secondary bg-clip-text text-transparent tracking-tight">
            Lumina
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-lumina-primary/15 text-lumina-primary border border-lumina-primary/30 rounded-full">
            NSRIT
          </span>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col justify-center mt-6">
          <h1 className="text-3xl xl:text-[2.1rem] font-black text-white leading-[1.15] mb-3">
            Adaptive AI
            <br />
            <span className="bg-gradient-to-r from-lumina-primary to-lumina-secondary bg-clip-text text-transparent">
              Engineering
            </span>
            <br />
            Education.
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed mb-7">
            Purpose-built for engineering colleges.
            <br />
            Role-aware, rubric-driven, real-time.
          </p>

          {/* Feature cards 2×2 */}
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-3.5 hover:border-lumina-primary/20 transition-colors"
              >
                <div className="text-lumina-primary mb-2">{f.icon}</div>
                <div className="text-xs font-semibold text-white mb-0.5">{f.title}</div>
                <div className="text-[11px] text-gray-500 leading-snug">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="border-t border-white/[0.06] pt-5 mt-5">
          <div className="flex items-center justify-between">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-lg font-black text-lumina-primary tabular-nums">{s.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Login Page ────────────────────────────────────────────────────────────
export default function LoginPage() {
  const [activeRole, setActiveRole] = useState<ActiveRole>("student");
  const [showPassword, setShowPassword]   = useState(false);
  const [showDemo, setShowDemo]           = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [submitted, setSubmitted]         = useState(false);

  // Student state
  const [rollNumber, setRollNumber] = useState("");

  // Faculty state
  const [facIdType, setFacIdType]         = useState<"employee_id" | "email">("employee_id");
  const [facIdentifier, setFacIdentifier] = useState("");
  const [facDept, setFacDept]             = useState("");

  // Admin state
  const [adminRoleValue, setAdminRoleValue] = useState("college_admin");
  const [adminEmail, setAdminEmail]         = useState("");

  // Shared
  const [password, setPassword] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    api.getCurrentUser().then((user) => {
      if (!user) return;
      if (user.mustChangePassword) { window.location.href = "/change-password"; return; }
      const routes: Record<string, string> = {
        super_admin: "/admin/dashboard", college_admin: "/college",
        hod: "/hod", faculty: "/faculty", student: "/student/dashboard",
      };
      window.location.href = routes[user.role] || "/student/dashboard";
    }).catch(() => {});
  }, []);

  // ── Tab switch ───────────────────────────────────────────────────────────────
  const switchRole = (role: ActiveRole) => {
    setActiveRole(role);
    setSubmitted(false);
    setShowPassword(false);
    setRollNumber("");
    setFacIdentifier("");
    setFacDept("");
    setAdminEmail("");
    setPassword("");
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const formErrors = (() => {
    const e: Record<string, string> = {};
    if (activeRole === "student") {
      if (!/^\d{2}NU\dA\d{4}$/.test(rollNumber.trim()))
        e.identifier = "Format: YYNUxAyyyy (e.g. 22NU1A0519)";
    } else if (activeRole === "faculty") {
      if (facIdType === "employee_id") {
        if (!/^FAC\d{3}$/.test(facIdentifier.trim()))
          e.identifier = "Format: FAC001 – FAC999";
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(facIdentifier.trim()))
          e.identifier = "Enter a valid email address";
      }
    } else {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim()))
        e.identifier = "Enter a valid institutional email";
    }
    if (!password || password.length < 8)
      e.password = "Password must be at least 8 characters";
    return e;
  })();

  const ve = submitted ? formErrors : {};

  const getIdentifier = () =>
    activeRole === "student" ? rollNumber.trim()
    : activeRole === "faculty" ? facIdentifier.trim()
    : adminEmail.trim();

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);
    try {
      const user = await api.login(getIdentifier(), password);
      if (user?.mustChangePassword) { window.location.href = "/change-password"; return; }
      if (user?.onboardingStep !== undefined && user.onboardingStep < 5) {
        window.location.href = "/onboarding"; return;
      }
      const routes: Record<string, string> = {
        super_admin: "/admin/dashboard", college_admin: "/college",
        hod: "/hod", faculty: "/faculty", student: "/student/dashboard",
      };
      window.location.href = routes[user?.role ?? ""] || "/student/dashboard";
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Demo fill ────────────────────────────────────────────────────────────────
  const fillDemo = (acc: { identifier: string; password: string }) => {
    if (activeRole === "student") {
      setRollNumber(acc.identifier);
    } else if (activeRole === "faculty") {
      const isEmpId = /^FAC\d{3}$/.test(acc.identifier);
      setFacIdType(isEmpId ? "employee_id" : "email");
      setFacIdentifier(acc.identifier);
    } else {
      setAdminEmail(acc.identifier);
    }
    setPassword(acc.password);
    setSubmitted(false);
  };

  const roleLabel = activeRole === "student" ? "Student"
    : activeRole === "faculty" ? "Faculty" : "Admin";

  // ── JSX ──────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex bg-[#0a0a0f] text-white">
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <span className="text-2xl font-black bg-gradient-to-r from-lumina-primary to-lumina-secondary bg-clip-text text-transparent">
            Lumina
          </span>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest bg-lumina-primary/15 text-lumina-primary border border-lumina-primary/30 rounded-full">
            NSRIT
          </span>
        </div>

        <div className="w-full max-w-[420px]">
          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-sm text-gray-400 mt-1">Sign in to your Lumina account</p>
          </div>

          {/* Role tabs */}
          <div className="flex bg-white/[0.05] border border-white/[0.08] rounded-xl p-1 mb-5">
            {(["student", "faculty", "admin"] as ActiveRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => switchRole(role)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  activeRole === role
                    ? "bg-lumina-primary text-black shadow-sm"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* STUDENT: Roll Number */}
            {activeRole === "student" && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Roll Number
                </label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="22NU1A0519"
                  autoComplete="username"
                  spellCheck={false}
                  className={`w-full px-3.5 py-2.5 bg-white/[0.05] border rounded-xl text-white font-mono placeholder-gray-600
                    focus:outline-none focus:ring-2 focus:ring-lumina-primary/40 focus:border-lumina-primary/50
                    transition-all text-sm tracking-wider ${ve.identifier ? "border-red-500/60" : "border-white/[0.10]"}`}
                />
                <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                  <span className="font-mono text-gray-400">YYNUxAyyyy</span>
                  {" "}— batch&nbsp;·&nbsp;branch code&nbsp;·&nbsp;roll
                </p>
                {ve.identifier && (
                  <p className="text-xs text-red-400 mt-1" role="alert">{ve.identifier}</p>
                )}
              </div>
            )}

            {/* FACULTY: ID type toggle + identifier + dept */}
            {activeRole === "faculty" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Identifier
                  </label>
                  {/* Toggle buttons */}
                  <div className="flex gap-2 mb-2">
                    {(["employee_id", "email"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setFacIdType(t); setFacIdentifier(""); setSubmitted(false); }}
                        className={`px-3 py-1 text-xs rounded-lg border transition-all ${
                          facIdType === t
                            ? "border-lumina-primary/60 bg-lumina-primary/10 text-lumina-primary"
                            : "border-white/[0.10] text-gray-500 hover:text-gray-300 hover:border-white/20"
                        }`}
                      >
                        {t === "employee_id" ? "Employee ID" : "Email Address"}
                      </button>
                    ))}
                  </div>
                  <input
                    type={facIdType === "email" ? "email" : "text"}
                    value={facIdentifier}
                    onChange={(e) => setFacIdentifier(e.target.value)}
                    placeholder={facIdType === "employee_id" ? "FAC001" : "faculty@nsrit.edu.in"}
                    autoComplete={facIdType === "email" ? "email" : "username"}
                    spellCheck={false}
                    className={`w-full px-3.5 py-2.5 bg-white/[0.05] border rounded-xl text-white
                      placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-lumina-primary/40
                      focus:border-lumina-primary/50 transition-all text-sm
                      ${facIdType === "employee_id" ? "font-mono tracking-wider" : ""}
                      ${ve.identifier ? "border-red-500/60" : "border-white/[0.10]"}`}
                  />
                  {ve.identifier && (
                    <p className="text-xs text-red-400 mt-1" role="alert">{ve.identifier}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Department <span className="text-gray-600">(optional)</span>
                  </label>
                  <select
                    value={facDept}
                    onChange={(e) => setFacDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.10] rounded-xl
                      text-white focus:outline-none focus:ring-2 focus:ring-lumina-primary/40
                      focus:border-lumina-primary/50 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-gray-900 text-gray-400">Select department</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-gray-900 text-white">{d}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* ADMIN: role dropdown + email */}
            {activeRole === "admin" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Admin Role
                  </label>
                  <select
                    value={adminRoleValue}
                    onChange={(e) => setAdminRoleValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/[0.05] border border-white/[0.10] rounded-xl
                      text-white focus:outline-none focus:ring-2 focus:ring-lumina-primary/40
                      focus:border-lumina-primary/50 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="college_admin" className="bg-gray-900">College Admin</option>
                    <option value="hod"           className="bg-gray-900">Head of Department</option>
                    <option value="super_admin"   className="bg-gray-900">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@nsrit.edu.in"
                    autoComplete="email"
                    className={`w-full px-3.5 py-2.5 bg-white/[0.05] border rounded-xl text-white
                      placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-lumina-primary/40
                      focus:border-lumina-primary/50 transition-all text-sm
                      ${ve.identifier ? "border-red-500/60" : "border-white/[0.10]"}`}
                  />
                  {ve.identifier && (
                    <p className="text-xs text-red-400 mt-1" role="alert">{ve.identifier}</p>
                  )}
                </div>
              </>
            )}

            {/* Password (all roles) */}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full px-3.5 py-2.5 pr-10 bg-white/[0.05] border rounded-xl text-white
                    placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-lumina-primary/40
                    focus:border-lumina-primary/50 transition-all text-sm
                    ${ve.password ? "border-red-500/60" : "border-white/[0.10]"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" aria-hidden="true" />
                    : <Eye    className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>
              {ve.password && (
                <p className="text-xs text-red-400 mt-1" role="alert">{ve.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2.5 px-4 bg-lumina-primary hover:bg-lumina-secondary
                disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-sm
                rounded-xl transition-all flex items-center justify-center gap-2
                shadow-lg shadow-lumina-primary/20"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path  className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                `Sign in as ${roleLabel}`
              )}
            </button>
          </form>

          {/* ─── Demo login drawer ─── */}
          <div className="mt-5 border border-white/[0.08] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowDemo(!showDemo)}
              className="w-full flex items-center justify-between px-4 py-3 text-xs text-gray-400
                hover:text-gray-300 hover:bg-white/[0.03] transition-colors"
            >
              <span>Show demo login credentials</span>
              {showDemo
                ? <ChevronUp   className="w-3.5 h-3.5" aria-hidden="true" />
                : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>

            {showDemo && (
              <div className="border-t border-white/[0.07] p-3 grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS[activeRole].map((acc, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03]
                      hover:bg-white/[0.07] border border-white/[0.06] hover:border-lumina-primary/20
                      transition-all text-left group"
                  >
                    <div className="w-7 h-7 rounded-full bg-lumina-primary/15 text-lumina-primary
                      text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {acc.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-white truncate">{acc.name}</div>
                      <div className="text-[10px] text-gray-500 truncate">{acc.roleLabel}</div>
                      <div className="text-[10px] font-mono text-lumina-primary/80 truncate">{acc.identifier}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Footer ─── */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-xs text-gray-500">
              New faculty/student?{" "}
              <a href="#" className="text-lumina-primary hover:text-lumina-secondary transition-colors">
                Request access via invite
              </a>
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="text-[11px] text-emerald-400 font-medium tracking-wide">SYSTEMS ONLINE</span>
            </div>
          </div>

          {/* ─── Research note ─── */}
          <div className="mt-5 p-3.5 bg-white/[0.025] border border-white/[0.06] rounded-xl">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <span className="text-gray-400 font-semibold">Why roll numbers & employee IDs?</span>{" "}
              Unlike Canvas (SSO) or Moodle (username/email), Lumina authenticates students by roll number
              and faculty by employee ID — matching the canonical identifiers used in Indian engineering
              colleges like NSRIT, where these supersede email as the primary institutional reference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
