"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Plus, 
  Search, 
  Clock, 
  Filter, 
  Download, 
  Settings2,
  Calendar,
  Share2,
  Trash2,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  name: string;
  type: string;
  last_generated: string;
  schedule: string;
  format: string;
}

export default function ReportBuilder() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking report templates
    const mockReports: Report[] = [
      {
        id: "rep-001",
        name: "Quarterly Academic Growth",
        type: "Performance",
        last_generated: "2 days ago",
        schedule: "Monthly",
        format: "PDF, XLSX"
      },
      {
        id: "rep-002",
        name: "NAAC Standard Compliance",
        type: "Compliance",
        last_generated: "15 days ago",
        schedule: "On Demand",
        format: "PDF"
      },
      {
        id: "rep-003",
        name: "AI Tutor Token Utilization",
        type: "Operational",
        last_generated: "1 hour ago",
        schedule: "Weekly",
        format: "CSV"
      }
    ];
    setReports(mockReports);
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-400" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-500" />
            Report Builder
          </h1>
          <p className="mt-1 text-gray-400">Design, automate, and distribute custom academic and system reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20">
            <Plus className="h-4 w-4" />
            New Report Template
          </button>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Templates Sidebar */}
        <div className="space-y-6">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Active Templates
          </h2>
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="glass-v2 border-white/5 p-4 hover:bg-white/[0.02] transition-all group cursor-pointer border-l-2 border-l-blue-500/30 hover:border-l-blue-500">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{report.name}</span>
                  <Settings2 className="h-3 w-3 text-gray-600 hover:text-white transition-colors" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] p-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase">{report.type}</span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-tighter">{report.schedule}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3 rounded-xl border border-dashed border-white/10 text-[10px] font-bold text-gray-500 uppercase hover:text-white hover:border-white/20 transition-all tracking-widest">
            Browse Report Gallery
          </button>
        </div>

        {/* Builder Viewport */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-v2 border-white/5 p-8 h-[550px] relative overflow-hidden flex flex-col">
            <div className="flex items-start justify-between mb-12">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <input 
                    type="text" 
                    defaultValue="Quarterly Academic Growth" 
                    className="bg-transparent border-none text-xl font-display font-bold text-white focus:outline-none focus:ring-0 w-80"
                  />
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-1">Editing Mode • Last saved 2m ago</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white"><Share2 className="h-4 w-4" /></button>
                <button className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>

            <div className="flex-1 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center gap-4 group">
              <div className="h-16 w-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-600 group-hover:text-gray-400 transition-colors">
                <Plus className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500">Drag & Drop Analytics Widgets</p>
                <p className="text-[10px] text-gray-700 mt-1 uppercase tracking-widest font-bold">Charts, Tables, KPIs, and Insights</p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-400 transition-all">
                  <Calendar className="h-3 w-3" />
                  Scheduled: Monthly
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-400 transition-all">
                  <Download className="h-3 w-3" />
                  Format: PDF/XLSX
                </div>
              </div>
              <button className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all">
                Generate Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
