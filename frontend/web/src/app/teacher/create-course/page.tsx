"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Upload, X, Loader2, Wand2, FileText, Check, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

export default function CreateCoursePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [previewBlueprint, setPreviewBlueprint] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "Beginner",
    image: "",
    id: "", // Slug
    code: "",
  });

  const handleGenerateSlug = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData((prev) => ({ ...prev, title, id: slug }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.title || !formData.description) {
      setError("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.createCourse(formData);
      if (res.success) {
        router.push("/teacher/courses");
      } else {
        setError(res.error || "Failed to create course.");
      }
    } catch (err: any) {
      console.error("❌ Course creation error:", err);
      let errMsg = err?.message || "Something went wrong. Please try again.";
      if (errMsg.toLowerCase().includes("already exists")) {
        errMsg += " Tip: Try typing a different 'Course Code' or modifying your slug.";
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiFile) {
      setError("Please select a file first (PDF or Image).");
      return;
    }

    setIsGenerating(true);
    setError("");
    setPreviewBlueprint(null);

    try {
      console.log("📤 Uploading file for blueprint:", aiFile.name, aiFile.type, aiFile.size);
      const res = await api.generateBlueprintFromFile(aiFile);
      console.log("📥 AI Blueprint response:", res);

      // Normalize: backend always returns { blueprint: { title, description, level, modules } }
      const bp = res?.blueprint;
      if (bp) {
        const normalized = {
          title: bp.title || "Untitled Course",
          description: bp.description || "",
          level: bp.level || "Beginner",
          modules: (bp.modules || bp.sections || []).map((m: any) => ({
            title: m.title || m.name || "Module",
            description: m.description || "",
            topics: m.topics || [],
            duration: m.duration || 45,
          })),
        };
        setPreviewBlueprint(normalized);
        setFormData((prev) => ({
          ...prev,
          title: normalized.title !== "Untitled Course" ? normalized.title : prev.title,
          description: normalized.description || prev.description,
          level: normalized.level || prev.level,
          id: normalized.title && normalized.title !== "Untitled Course"
            ? normalized.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
            : prev.id,
        }));
      } else {
        setError("AI was unable to extract a structure from this material.");
      }
    } catch (err: any) {
      console.error("❌ Blueprint generation error:", err);
      setError(err.message || "Blueprint generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  const confirmAndCreate = async () => {
    setIsLoading(true);
    setError("");
    try {
      const createData = {
        name: formData.title,
        title: formData.title,
        description: formData.description,
        level: formData.level,
        thumbnail: formData.image,
        modules: previewBlueprint?.modules || [],
        // Use code if edited, else use slug, or leave empty for backend auto-gen
        code: formData.code || formData.id || "",
        status: "draft",
      };

      console.log("📤 Creating course with blueprint data:", createData);
      const res = await api.createCourse(createData);
      console.log("✅ Course created:", res);
      router.push("/teacher/courses");
    } catch (err: any) {
      console.error("❌ Course creation error:", err);
      let errMsg = err?.message || "Failed to create course. Please try again.";
      if (errMsg.toLowerCase().includes("already exists")) {
        errMsg += " Tip: Try using a significantly different course code or adding a suffix like -v2.";
      }
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <BackButton href="/teacher/courses" label="Back to courses" className="mb-0" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Create New Course
          </h1>
          <p className="text-gray-400">
            Design your curriculum and reach students.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Mode Selector */}
      <div className="flex p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
        <button
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            mode === "manual"
              ? "bg-lumina-primary text-black font-bold"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <FileText className="w-4 h-4" />
          Manual Entry
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            mode === "ai"
              ? "bg-lumina-primary text-black font-bold shadow-lg shadow-lumina-primary/20"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Magic Blueprint (AI)
        </button>
      </div>

      {mode === "ai" && !previewBlueprint ? (
        <div className="glass-card p-10 text-center space-y-6">
          {/* Magic Progress State */}
          {isGenerating && aiFile && !previewBlueprint && (
            <div className="glass-v2-primary p-12 text-center space-y-6 animate-pulse border-amber-500/20 mb-8 shadow-2xl shadow-amber-500/10">
              <div className="relative inline-block">
                {aiFile.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(aiFile)} alt="Preview" className="w-24 h-24 object-cover rounded-xl border border-amber-500/30 mx-auto" />
                ) : (
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto" />
                    <Sparkles className="w-8 h-8 text-amber-400 absolute -top-2 -right-2 animate-bounce" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold gradient-text-gold">Analyzing {aiFile.type.startsWith('image/') ? "Photo" : "Document"}...</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Lumina AI is architecting your course roadmap from <span className="text-foreground font-medium">{aiFile.name}</span>.
                </p>
              </div>
            </div>
          )}
          <div className="w-20 h-20 bg-lumina-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-lumina-primary/20">
            <Upload className="w-8 h-8 text-lumina-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Upload Syllabus or Textbook</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Our AI will analyze your PDF or Image (photo) and generate a complete course structure including modules and topics instantly.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <label className="block w-full cursor-pointer group">
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 group-hover:border-lumina-primary transition-colors bg-white/5">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setAiFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <span className="text-gray-300">
                  {aiFile ? aiFile.name : "Select Syllabus (PDF or Image)"}
                </span>
              </div>
            </label>
          </div>

          <button
            onClick={handleAIUpload}
            disabled={!aiFile || isGenerating}
            className="px-8 py-3 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Document...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Magic Blueprint
              </>
            )}
          </button>
        </div>
      ) : previewBlueprint ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="glass-card-premium p-8 border-amber-500/10">
            <div className="flex items-start justify-between mb-6">
              <div className="w-full mr-4">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-500/80">AI Blueprint Ready</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-amber-500/60 uppercase font-bold tracking-tighter mb-1 block">Course Title</label>
                    <input 
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleGenerateSlug(e.target.value)}
                      className="text-3xl font-bold tracking-tight bg-transparent border-b border-white/10 w-full focus:border-amber-500 outline-none pb-1 transition-all"
                    />
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-amber-500/60 uppercase font-bold tracking-tighter mb-1 block">Course Code (Unique)</label>
                      <input 
                        type="text"
                        value={formData.code || formData.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                        placeholder="e.g. math-101"
                        className="text-lg font-mono bg-white/5 border border-white/10 rounded-lg px-3 py-1 w-full focus:border-amber-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-amber-500/60 uppercase font-bold tracking-tighter mb-1 block">Difficulty</label>
                      <div className="px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-bold h-10 flex items-center">
                        {previewBlueprint.level || "Beginner"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-amber-500/60 uppercase font-bold tracking-tighter mb-1 block">Description</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="text-lg text-muted-foreground leading-relaxed bg-transparent border-none w-full focus:ring-0 outline-none resize-none p-0"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {previewBlueprint.modules && previewBlueprint.modules.map((module: any, mIdx: number) => (
                <div key={mIdx} className="glass rounded-2xl p-6 border-white/5 hover:border-amber-500/20 transition-colors group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold group-hover:bg-amber-500 group-hover:text-black transition-all">
                      {mIdx + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{module.title}</h4>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-14">
                    {module.topics && module.topics.map((topic: any, tIdx: number) => (
                      <div key={tIdx} className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500/40" />
                        <div>
                          <p className="font-semibold text-sm">{topic.title}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{topic.duration_minutes || 45} mins</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-white/5 flex justify-end gap-4">
              <Button 
                variant="outline" 
                onClick={() => { setPreviewBlueprint(null); setAiFile(null); }}
                className="glass-button-secondary py-6 px-8"
              >
                Discard and Reset
              </Button>
              <Button 
                onClick={confirmAndCreate} 
                disabled={isLoading}
                className="glass-button-highlight py-6 px-10 text-lg"
              >
                {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-5 h-5" />}
                Confirm Course Structure
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Details Card */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">
            Course Details
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleGenerateSlug(e.target.value)}
              placeholder="e.g. Advanced Machine Learning"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lumina-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Slug (URL Identifier - used for code if specified)
            </label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-lumina-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Course Code (e.g. math101)
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g. cs101"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lumina-primary outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what students will learn..."
              rows={4}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lumina-primary outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Difficulty Level
              </label>
              <select
                value={formData.level}
                onChange={(e) =>
                  setFormData({ ...formData, level: e.target.value })
                }
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lumina-primary outline-none appearance-none"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Thumbnail URL
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) =>
                  setFormData({ ...formData, image: e.target.value })
                }
                placeholder="http://..."
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-lumina-primary outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 rounded-xl bg-lumina-primary text-black font-bold hover:bg-lumina-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                creating...
              </>
            ) : (
              "Create Course"
            )}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
