"use client";

import { useState } from "react";
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Database,
  Sparkles,
  Zap,
  Info,
  X
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UploadStep {
  id: number;
  label: string;
  status: "waiting" | "processing" | "completed" | "error";
  description: string;
}

export default function TextbookUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<UploadStep[]>([
    { id: 1, label: "PDF Extraction", status: "waiting", description: "Parsing text and layout from student materials." },
    { id: 2, label: "Concept Detection", status: "waiting", description: "Identifying key pedagogical nodes and definitions." },
    { id: 3, label: "Knowledge Graph Mapping", status: "waiting", description: "Linking concepts into a semantic structure." },
    { id: 4, label: "Blueprint Generation", status: "waiting", description: "Drafting lesson plans and assessment paths." }
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startUpload = () => {
    setIsUploading(true);
    let step = 0;
    
    const interval = setInterval(() => {
      setSteps(prev => prev.map((s, i) => {
        if (i === step) return { ...s, status: "completed" };
        if (i === step + 1) return { ...s, status: "processing" };
        return s;
      }));
      
      step++;
      setCurrentStep(step);
      
      if (step >= steps.length) {
        clearInterval(interval);
      }
    }, 3000);
  };

  return (
    <div className="min-h-screen space-y-8 p-8">
      <header>
        <Link 
          href="/teacher/resources"
          className="mb-4 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>
        <h1 className="text-4xl font-display font-bold text-white tracking-tight">
          Textbook Upload
        </h1>
        <p className="mt-2 text-gray-400 max-w-2xl">
          Transform static PDFs into interactive learning tracks. AI extracts core concepts, builds a knowledge graph, and scaffolds your course in minutes.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {!isUploading ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-v2 border-2 border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center group hover:border-amber-400/30 hover:bg-white/[0.02] transition-all cursor-pointer relative"
            >
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept=".pdf"
                onChange={handleFileChange}
              />
              <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-amber-400 group-hover:scale-110 transition-all mb-6">
                <Upload className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-bold text-white">
                {file ? file.name : "Drop your textbook PDF here"}
              </h3>
              <p className="text-gray-500 mt-2 max-w-xs">
                Supports standard academic PDFs up to 50MB. Scanned documents will be routed to OCR automatically.
              </p>
              
              {file && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    startUpload();
                  }}
                  className="mt-8 rounded-2xl bg-amber-400 px-8 py-3 font-bold text-black hover:bg-amber-300 transition-all shadow-[0_0_30px_rgba(251,191,36,0.2)]"
                >
                  Confirm & Start Extraction
                </button>
              )}
            </motion.div>
          ) : (
            <div className="glass-v2 border-white/5 rounded-3xl p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Processing Content</h3>
                  <p className="text-sm text-gray-500">{file?.name}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Zap className="h-4 w-4 animate-pulse" />
                  AI PIPELINE ACTIVE
                </div>
              </div>

              <div className="space-y-6">
                {steps.map((step, i) => (
                  <div key={step.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all",
                        step.status === "completed" ? "bg-yellow-500 border-yellow-500 text-black" :
                        step.status === "processing" ? "bg-amber-400/20 border-amber-400 text-amber-400" :
                        "bg-white/5 border-white/10 text-gray-600"
                      )}>
                        {step.status === "completed" ? <CheckCircle2 className="h-5 w-5" /> : 
                         step.status === "processing" ? <Clock className="h-5 w-5 animate-spin" /> : 
                         <span className="text-xs font-bold">{step.id}</span>}
                      </div>
                      {i < steps.length - 1 && (
                        <div className={cn(
                          "w-px flex-1 my-1",
                          step.status === "completed" ? "bg-yellow-500" : "bg-white/10"
                        )} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={cn(
                        "font-bold transition-all",
                        step.status === "completed" ? "text-white" :
                        step.status === "processing" ? "text-amber-300" :
                        "text-gray-600"
                      )}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {currentStep >= steps.length && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center text-center gap-4"
                >
                  <p className="text-sm text-yellow-300 font-semibold">Pipeline Complete! Knowledge Graph generated.</p>
                  <Link 
                    href="/teacher/create-course?blueprint=extracted"
                    className="rounded-xl bg-yellow-500 px-6 py-2 text-sm font-bold text-black hover:bg-yellow-400 transition-all"
                  >
                    Open Course Blueprint
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-400" />
              Content Guidelines
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm text-gray-400">
                <CheckCircle2 className="h-4 w-4 text-yellow-400 shrink-0" />
                Textbooks with index/TOC work best for concept mapping.
              </li>
              <li className="flex gap-3 text-sm text-gray-400">
                <CheckCircle2 className="h-4 w-4 text-yellow-400 shrink-0" />
                Supports diagrams, formulas, and multi-column layouts.
              </li>
              <li className="flex gap-3 text-sm text-gray-400">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                Avoid encrypted PDF files.
              </li>
            </ul>
          </section>

          <div className="p-6 rounded-3xl bg-amber-400/10 border border-amber-400/20">
            <div className="flex gap-4">
              <Sparkles className="h-6 w-6 text-amber-400 shrink-0" />
              <div className="space-y-2">
                <p className="text-sm font-bold text-amber-100">OCR Intelligence</p>
                <p className="text-xs text-amber-200/60 leading-relaxed">
                  Lumina uses Gemini Vision to detect text in scanned images. If your document has low text density, we'll automatically route it to the OCR engine.
                </p>
              </div>
            </div>
          </div>

          <section className="glass-v2 border-white/5 p-8 rounded-3xl">
            <h3 className="text-lg font-bold text-white mb-4">Pipeline Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Avg. Concept Extraction</span>
                <span className="text-white">42 nodes / min</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">OCR Accuracy</span>
                <span className="text-white">98.4%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">KG Fidelity</span>
                <span className="text-white">High</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
