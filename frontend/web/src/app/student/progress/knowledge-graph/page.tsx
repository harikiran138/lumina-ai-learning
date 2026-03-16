"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, ArrowLeft, Info, Search, Filter, Layers, Zap } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Node = {
  id: string;
  label: string;
  status: "mastered" | "learning" | "locked";
  x: number;
  y: number;
  description: string;
  mastery: number;
};

type Edge = {
  source: string;
  target: string;
};

export default function KnowledgeGraphPage() {
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [courseTitle, setCourseTitle] = useState("Your Learning Path");
  const [coverage, setCoverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [primaryCourseId, setPrimaryCourseId] = useState<string | null>(null);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const token = typeof window !== "undefined" ? sessionStorage.getItem("lumina_token") || "" : "";
    const headers = { Authorization: `Bearer ${token}` };

    const fetchGraph = async () => {
      setIsLoading(true);
      try {
        // 1. Get enrolled courses from dashboard
        const dashRes = await fetch(`${apiBase}/api/student/dashboard`, { headers });
        const dash = dashRes.ok ? await dashRes.json() : {};
        const enrolled: any[] = dash.enrolledCourses || [];

        if (enrolled.length === 0) {
          // Use fallback mock if no courses
          const mockNodes: Node[] = [
            { id: "1", label: "Fundamental Logic", status: "mastered", x: 100, y: 300, mastery: 95, description: "Enroll in a course to see your real knowledge graph." },
          ];
          setNodes(mockNodes);
          setEdges([]);
          setIsLoading(false);
          return;
        }

        // Pick the course with latest activity as the primary graph
        const primary = enrolled[0];
        setPrimaryCourseId(primary.id);
        setCourseTitle(primary.name || primary.title || "Learning Path");

        // 2. Fetch knowledge nodes for that course
        const kgRes = await fetch(`${apiBase}/api/knowledge-graph/${primary.id}`, { headers });
        const rawNodes: any[] = kgRes.ok ? await kgRes.json() : [];

        if (rawNodes.length === 0) {
          // No nodes yet — show empty state
          setNodes([]);
          setEdges([]);
          setIsLoading(false);
          return;
        }

        // 3. Build auto-layout positions (radial / grid)
        const cols = Math.ceil(Math.sqrt(rawNodes.length));
        const hSpacing = 850 / (cols + 1);
        const vSpacing = 500 / (Math.ceil(rawNodes.length / cols) + 1);

        const nodeMap: Record<string, Node> = {};
        const layoutNodes: Node[] = rawNodes.map((n: any, idx: number) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          const nodeObj: Node = {
            id: n.concept,
            label: n.concept,
            status: (n.metadata?.status as Node["status"]) || "locked",
            x: hSpacing + col * hSpacing,
            y: vSpacing + row * vSpacing,
            mastery: Math.round((n.metadata?.mastery || 0) * 100),
            description: n.metadata?.description || `Difficulty: ${n.difficulty}`,
          };
          nodeMap[n.concept] = nodeObj;
          return nodeObj;
        });

        // 4. Build edges from prerequisites
        const layoutEdges: Edge[] = [];
        rawNodes.forEach((n: any) => {
          (n.prerequisites || []).forEach((prereq: string) => {
            if (nodeMap[prereq] && nodeMap[n.concept]) {
              layoutEdges.push({ source: prereq, target: n.concept });
            }
          });
        });

        // 5. Compute coverage
        const mastered = layoutNodes.filter(n => n.status === "mastered").length;
        setCoverage(Math.round((mastered / layoutNodes.length) * 100));
        setNodes(layoutNodes);
        setEdges(layoutEdges);
      } catch (err) {
        console.error("Knowledge graph fetch error", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-black/40 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link href="/student/progress" className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-lumina-primary" />
              Knowledge Graph
            </h1>
            <p className="text-xs text-gray-400">{courseTitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            <button className="px-3 py-1 text-xs font-medium text-white bg-lumina-primary/20 rounded-md">2D Graph</button>
            <button className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-white" onClick={() => window.location.reload()}>Refresh</button>
          </div>
          <button className="p-2 bg-white/5 rounded-lg border border-white/10 text-gray-400">
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-10" 
          style={{ 
            backgroundImage: "radial-gradient(#ffffff 0.5px, transparent 0.5px)", 
            backgroundSize: "24px 24px" 
          }} 
        />

        {/* Global Stats Overlay */}
        <div className="absolute top-6 left-6 z-20 space-y-3">
          <div className="glass-card p-4 w-48 border border-white/10">
            <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Coverage</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{coverage}%</span>
              <span className="text-xs text-yellow-500 font-medium">+5%</span>
            </div>
            <div className="mt-2 h-1 bg-white/10 rounded-full">
              <div className="h-full bg-lumina-primary rounded-full transition-all duration-1000" style={{ width: `${coverage}%` }} />
            </div>
          </div>
          
          <div className="flex gap-2">
             <LegendItem color="bg-yellow-500" label="Mastered" />
             <LegendItem color="bg-amber-500" label="In Progress" />
             <LegendItem color="bg-gray-700" label="Locked" />
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
          <svg className="w-full h-full" viewBox="0 0 1000 600">
            {/* Defs for gradients/filters */}
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Edges */}
            {edges.map((edge, i) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              return (
                <line
                  key={`${edge.source}-${edge.target}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={source.status === "mastered" && target.status !== "locked" ? "#88ffcc22" : "#333"}
                  strokeWidth="2"
                  strokeDasharray={target.status === "locked" ? "4 4" : "0"}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <g 
                key={node.id} 
                className="group cursor-pointer" 
                onClick={() => setSelectedNode(node)}
              >
                {/* Outer Glow for selection */}
                {selectedNode?.id === node.id && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={24}
                    fill="none"
                    stroke="#88ffcc"
                    strokeWidth="2"
                    strokeOpacity="0.5"
                  />
                )}
                
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={12}
                  className={`transition-all duration-300 ${
                    node.status === "mastered" ? "fill-yellow-500" : 
                    node.status === "learning" ? "fill-amber-500" : "fill-gray-800"
                  } ${selectedNode?.id === node.id ? "r-16" : ""}`}
                  filter={node.status !== "locked" ? "url(#glow)" : ""}
                />
                
                <text
                  x={node.x}
                  y={node.y + 30}
                  textAnchor="middle"
                  className="fill-gray-400 text-[10px] font-medium pointer-events-none transition-colors group-hover:fill-white"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Sidebar Info */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              className="absolute top-0 right-0 w-80 h-full bg-black/60 backdrop-blur-xl border-l border-white/10 p-6 z-30"
            >
              <button 
                onClick={() => setSelectedNode(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-lg text-gray-400"
              >
                <Zap className="w-4 h-4" />
              </button>

              <div className="mt-8 space-y-6">
                <div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    selectedNode.status === "mastered" ? "bg-yellow-500/15 text-yellow-400" :
                    selectedNode.status === "learning" ? "bg-amber-500/15 text-amber-400" : "bg-white/5 text-gray-500"
                  }`}>
                    {selectedNode.status.replace("-", " ")}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-2">{selectedNode.label}</h2>
                  <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Mastery</p>
                    <p className="text-lg font-bold text-white">{selectedNode.mastery}%</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Difficulty</p>
                    <p className="text-lg font-bold text-white">4.2 / 5</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Required Skills</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-300">
                      <span>Propositional Logic</span>
                      <span className="text-yellow-500 font-bold">100%</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 text-xs text-gray-300">
                      <span>Set Theory</span>
                      <span className="text-amber-500 font-bold">45%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  {primaryCourseId ? (
                    <Link href={`/student/courses/${primaryCourseId}`}>
                      <button className="w-full py-3 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-all active:scale-95">
                        Start Learning
                      </button>
                    </Link>
                  ) : (
                    <button className="w-full py-3 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-all active:scale-95">
                      Start Learning
                    </button>
                  )}
                  <p className="text-center text-[10px] text-gray-500 mt-3 flex items-center justify-center gap-1">
                    <Info className="w-3 h-3" />
                    Recommended by AI Tutor based on your path
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2 bg-black/40 px-2 py-1.5 rounded-lg border border-white/5">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-[10px] text-gray-400 font-medium">{label}</span>
    </div>
  );
}
