"use client";

/**
 * MLFD — Multi-Layer Feature Detection
 * Gemini Vision lecture video analysis page.
 *
 * Flow:
 *   1. Teacher uploads a video or pastes a URL
 *   2. Selects analysis config (depth, language, chapter markers)
 *   3. Job is queued; useJobPoller tracks status
 *   4. Results panel shows detected concepts, difficulty, timestamps, suggested quizzes
 *   5. Export as PDF or push to course as a new module
 */

import { useState, useCallback } from "react";
import {
  Upload,
  Link2,
  Settings2,
  Cpu,
  CheckCircle,
  FileText,
  BookPlus,
  Loader2,
  AlertCircle,
  BarChart3,
  Clock,
  Tag,
  HelpCircle,
  ChevronRight,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useJobPoller } from "@/hooks/useJobPoller";

type AnalysisDepth = "quick" | "full";
type Language = "english" | "telugu" | "hindi";

interface VideoAnalysisResult {
  concepts: Array<{
    name: string;
    difficulty: "easy" | "medium" | "hard";
    timestamp_start: number;
    timestamp_end: number;
    confidence: number;
  }>;
  chapter_markers: Array<{ title: string; timestamp: number }>;
  suggested_quiz_questions: Array<{
    question: string;
    options: string[];
    correct_index: number;
    concept: string;
  }>;
  overall_difficulty: "easy" | "medium" | "hard";
  duration_minutes: number;
  language_detected: string;
}

const DIFFICULTY_COLORS = {
  easy: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoAnalysisPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<"url" | "upload">("url");
  const [depth, setDepth] = useState<AnalysisDepth>("quick");
  const [language, setLanguage] = useState<Language>("english");
  const [enableChapterMarkers, setEnableChapterMarkers] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { status, result, error: pollError } = useJobPoller<VideoAnalysisResult>(jobId);

  const handleSubmit = useCallback(async () => {
    setSubmitError(null);
    setJobId(null);

    try {
      let body: FormData | string;
      let contentType: string | undefined;

      if (inputMode === "url") {
        if (!videoUrl.trim()) { setSubmitError("Please enter a video URL"); return; }
        body = JSON.stringify({
          video_url: videoUrl.trim(),
          depth,
          language,
          enable_chapter_markers: enableChapterMarkers,
        });
        contentType = "application/json";
      } else {
        if (!uploadFile) { setSubmitError("Please select a video file"); return; }
        const form = new FormData();
        form.append("file", uploadFile);
        form.append("depth", depth);
        form.append("language", language);
        form.append("enable_chapter_markers", String(enableChapterMarkers));
        body = form;
      }

      const res = await fetch("/api/teacher/video-analysis", {
        method: "POST",
        ...(contentType ? { headers: { "Content-Type": contentType } } : {}),
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setJobId(data.job_id);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Submission failed");
    }
  }, [inputMode, videoUrl, uploadFile, depth, language, enableChapterMarkers]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setUploadFile(file);
      setInputMode("upload");
    }
  }, []);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/teacher/video-analysis/export?job_id=${jobId}&format=pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video-analysis.pdf";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExporting(false);
    }
  };

  const handlePushToModule = async () => {
    if (!jobId) return;
    const courseId = prompt("Enter Course ID to push this as a new module:");
    if (!courseId) return;
    await fetch("/api/teacher/video-analysis/push-module", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId, course_id: courseId }),
    });
  };

  const analysisResult = result as VideoAnalysisResult | null;
  const isProcessing = status === "queued" || status === "processing";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center flex-shrink-0">
          <Cpu className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Video Analysis — MLFD</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Multi-Layer Feature Detection powered by Gemini Vision. Upload a lecture video to extract
            concepts, difficulty levels, timestamps, and auto-generate quiz questions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Left: Input + Config */}
        <div className="space-y-4">
          {/* Input mode toggle */}
          <div className="flex rounded-xl bg-white/5 border border-white/10 p-1 gap-1">
            <button
              onClick={() => setInputMode("url")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                inputMode === "url"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <Link2 className="w-3.5 h-3.5" />
              Video URL
            </button>
            <button
              onClick={() => setInputMode("upload")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors",
                inputMode === "upload"
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload File
            </button>
          </div>

          {/* URL input */}
          {inputMode === "url" ? (
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://… (YouTube, MinIO, direct MP4)"
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-sm px-4 py-3 focus:outline-none focus:border-purple-500/50 placeholder:text-white/20"
            />
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative rounded-xl border-2 border-dashed border-white/15 bg-white/3 p-8 text-center hover:border-white/25 transition-colors cursor-pointer"
              onClick={() => document.getElementById("video-upload-input")?.click()}
            >
              <input
                id="video-upload-input"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              />
              {uploadFile ? (
                <div className="flex items-center gap-3 justify-center">
                  <Video className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-white font-medium">{uploadFile.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drag & drop a video, or click to browse
                  </p>
                  <p className="text-[11px] text-white/20 mt-1">MP4, MKV, WebM supported</p>
                </>
              )}
            </div>
          )}

          {/* Analysis config */}
          <div className="rounded-xl bg-surface-900 border border-white/8 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-white">Analysis Config</span>
            </div>

            {/* Depth */}
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-2">
                Analysis Depth
              </label>
              <div className="flex gap-2">
                {([["quick", "Quick (~5 min)", "emerald"], ["full", "Full (~45 min)", "purple"]] as const).map(
                  ([value, label, color]) => (
                    <button
                      key={value}
                      onClick={() => setDepth(value)}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors",
                        depth === value
                          ? `bg-${color}-500/15 text-${color}-400 border-${color}-500/25`
                          : "bg-white/3 text-muted-foreground border-white/10 hover:border-white/20"
                      )}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 py-2 focus:outline-none"
              >
                <option value="english">English</option>
                <option value="telugu">Telugu</option>
                <option value="hindi">Hindi</option>
              </select>
            </div>

            {/* Chapter markers */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setEnableChapterMarkers(!enableChapterMarkers)}
                className={cn(
                  "w-9 h-5 rounded-full relative transition-colors",
                  enableChapterMarkers ? "bg-purple-500" : "bg-white/15"
                )}
              >
                <div className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  enableChapterMarkers ? "translate-x-4" : "translate-x-0.5"
                )} />
              </div>
              <span className="text-sm text-muted-foreground">Auto-detect chapter markers</span>
            </label>
          </div>

          {/* Submit */}
          {submitError && (
            <div className="flex items-center gap-2 text-red-400 text-xs rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 text-sm font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                Start Analysis
              </>
            )}
          </button>

          {/* Progress tracker */}
          {(status || pollError) && (
            <div className="rounded-xl bg-surface-900 border border-white/8 p-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Job Status</p>
              <div className="space-y-2">
                {(["queued", "processing", "complete"] as const).map((s, i) => {
                  const reached =
                    status === "complete" ? true :
                    status === "processing" ? i <= 1 :
                    status === "queued" ? i === 0 : false;
                  const current =
                    (status === "queued" && s === "queued") ||
                    (status === "processing" && s === "processing") ||
                    (status === "complete" && s === "complete");
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border",
                        current && status !== "complete" ? "border-purple-500 bg-purple-500/20" :
                        reached ? "border-emerald-500 bg-emerald-500/20" :
                        "border-white/15 bg-white/5"
                      )}>
                        {reached && !current ? (
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                        ) : current && status !== "complete" ? (
                          <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                        ) : null}
                      </div>
                      <span className={cn(
                        "text-xs capitalize",
                        current ? "text-white font-medium" : reached ? "text-emerald-400" : "text-muted-foreground"
                      )}>
                        {s}
                      </span>
                    </div>
                  );
                })}
                {(status === "failed" || pollError) && (
                  <div className="flex items-center gap-2 text-red-400 text-xs mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {pollError ?? "Analysis failed"}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Results panel */}
        <div className="space-y-4">
          {!analysisResult && !isProcessing && (
            <div className="rounded-2xl bg-surface-900 border border-white/8 p-8 text-center">
              <Video className="w-10 h-10 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Submit a video to see analysis results here
              </p>
            </div>
          )}

          {isProcessing && !analysisResult && (
            <div className="rounded-2xl bg-surface-900 border border-white/8 p-8 text-center">
              <Loader2 className="w-8 h-8 text-purple-400 mx-auto mb-3 animate-spin" />
              <p className="text-sm text-white font-medium">Gemini Vision is analyzing your video</p>
              <p className="text-xs text-muted-foreground mt-1">
                {depth === "quick" ? "Est. ~5 minutes" : "Est. ~45 minutes"}
              </p>
            </div>
          )}

          {analysisResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-2xl bg-surface-900 border border-white/8 p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{analysisResult.concepts.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Concepts</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{analysisResult.duration_minutes} min</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Duration</p>
                  </div>
                  <div>
                    <span className={cn("text-sm font-bold px-2 py-0.5 rounded-full border", DIFFICULTY_COLORS[analysisResult.overall_difficulty])}>
                      {analysisResult.overall_difficulty}
                    </span>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Difficulty</p>
                  </div>
                </div>
              </div>

              {/* Concepts */}
              <div className="rounded-2xl bg-surface-900 border border-white/8 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-sm font-medium text-white">Detected Concepts</span>
                </div>
                <div className="divide-y divide-white/5 max-h-[240px] overflow-y-auto">
                  {analysisResult.concepts.map((c, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border font-medium", DIFFICULTY_COLORS[c.difficulty])}>
                        {c.difficulty}
                      </span>
                      <span className="text-xs text-white flex-1">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(c.timestamp_start)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested quiz questions */}
              {analysisResult.suggested_quiz_questions.length > 0 && (
                <div className="rounded-2xl bg-surface-900 border border-white/8 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-sm font-medium text-white">
                      Suggested Quiz Questions ({analysisResult.suggested_quiz_questions.length})
                    </span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-[200px] overflow-y-auto">
                    {analysisResult.suggested_quiz_questions.map((q, i) => (
                      <div key={i} className="px-4 py-3">
                        <p className="text-xs text-white mb-1 leading-relaxed">{q.question}</p>
                        <p className="text-[10px] text-muted-foreground">{q.concept}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleExportPDF}
                  disabled={exporting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-muted-foreground text-xs font-medium hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  Export PDF
                </button>
                <button
                  onClick={handlePushToModule}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-medium hover:bg-emerald-500/25 transition-colors"
                >
                  <BookPlus className="w-3.5 h-3.5" />
                  Push to Course
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
