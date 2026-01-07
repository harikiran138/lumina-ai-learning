import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, GraduationCap, ChevronRight, RotateCcw, Youtube, Copy, BarChart3, Table as TableIcon, Loader2, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { jsonrepair } from 'jsonrepair';
import { z } from 'zod';

// Register ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- Zod Schemas for Validation ---

const QuizSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).min(2), // Relaxed from length(4)
  correctIndex: z.number().int().min(0).optional().default(0), // Made optional with default
  explanation: z.string().optional().default("No explanation provided."), // Made optional
  topic: z.string().optional().default("General"), // Made optional
  difficulty: z.string().transform(val => val.toLowerCase()).pipe(z.enum(["easy", "medium", "hard"])).optional().default("medium"), // Case insensitive & optional
});

const FlashcardSchema = z.object({
  front: z.string(),
  back: z.string(),
  subject: z.string(),
});

const CourseCardSchema = z.object({
  title: z.string(),
  code: z.string(),
  description: z.string(),
  matchScore: z.number().optional(),
});

const YoutubeVideoSchema = z.object({
  videoId: z.string(),
  title: z.string().optional(),
});

const CodeBlockSchema = z.object({
  code: z.string(),
  language: z.string().default("text"),
  filename: z.string().optional(),
  explanation: z.string().optional().default(""), // Optional default for backward compat, but encouraged
});

const TimelineSchema = z.object({
  title: z.string(),
  events: z.array(z.object({
    date: z.string(),
    title: z.string(),
    description: z.string(),
  })),
});

const ComparisonTableSchema = z.object({
  title: z.string(),
  headers: z.array(z.string()).min(2),
  rows: z.array(z.object({
    feature: z.string(),
    values: z.array(z.string()),
  })),
});

const ChartSchema = z.object({
  type: z.enum(['bar', 'line', 'pie', 'doughnut']).default('bar'),
  title: z.string().default('Chart'),
  labels: z.array(z.string()).default([]),
  data: z.array(z.number()).default([]),
  datasetLabel: z.string().default("Data"),
  colors: z.array(z.string()).optional(),
});

const TableSchema = z.object({
  title: z.string().optional(),
  headers: z.array(z.string()),
  rows: z.array(z.array(z.string())),
});

const MermaidSchema = z.object({
  chart: z.string(),
  title: z.string().optional().default("Diagram"),
});

const PPTDownloadSchema = z.object({
  topic: z.string(),
  slideCount: z.number(),
  downloadUrl: z.string(),
  filename: z.string(),
  fileSize: z.string().optional(),
  slideTitles: z.array(z.string()).optional(),
  slideData: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    slides: z.array(z.object({
      title: z.string(),
      bullets: z.array(z.string())
    }))
  }).optional()
});

const ScoreCardSchema = z.object({
  title: z.string(),
  score: z.string(),
  percentage: z.number(),
  correctCount: z.number(),
  totalCount: z.number(),
  topic: z.string(),
  message: z.string().optional(),
});

// --- Component Interfaces (Derived from Zod) ---
// Using specific interfaces for props usage in components

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class A2UIErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("A2UI Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-xl flex flex-col gap-2 text-red-300 text-sm">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4" />
            Failed to render component
          </div>
          {this.state.error && <div className="text-xs font-mono opacity-80 whitespace-pre-wrap">{this.state.error.toString()}</div>}
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Specific Components ---

const QuizComponent = ({ question, options, correctIndex, explanation, topic, difficulty, onAction }: z.infer<typeof QuizSchema> & { onAction?: any }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isActionTaken, setIsActionTaken] = useState(false);

    const handleSelect = (idx: number) => {
        if (!isSubmitted) setSelected(idx);
    };

    const handleSubmit = () => {
        if (selected !== null && !isSubmitted) {
            setIsSubmitted(true);
            if (onAction) {
                onAction('quiz_answer', {
                    question,
                    selectedOption: options[selected],
                    isCorrect: selected === correctIndex,
                    topic,
                    difficulty
                });
            }
        }
    };

    const handleNext = () => {
        if (onAction && !isActionTaken) {
            setIsActionTaken(true);
            onAction('quiz_next', {});
        }
    };

    const handleFinish = () => {
        if (onAction && !isActionTaken) {
            setIsActionTaken(true);
            onAction('quiz_end', {});
        }
    };

    const isCorrect = selected === correctIndex;

    // Collapsed View (History)
    if (isActionTaken) {
        return (
            <motion.div 
                initial={{ opacity: 1, height: 'auto' }}
                animate={{ opacity: 0.8 }}
                className={`my-4 p-4 rounded-xl border ${isCorrect ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'} flex items-center justify-between`}
            >
                <div>
                     <div className="flex gap-2 mb-1">
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10 text-gray-400">{topic}</Badge>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10 text-gray-400 capitalize">{difficulty}</Badge>
                     </div>
                     <div className="flex items-center gap-3">
                        {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                        <div>
                            <p className="text-sm font-medium text-gray-300 line-clamp-1">{question}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                You chose: <span className={isCorrect ? "text-green-400" : "text-red-400"}>{options[selected ?? -1] || "Skipped"}</span>
                            </p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className={`text-xs ${isCorrect ? 'border-green-500/30 text-green-500' : 'border-red-500/30 text-red-500'}`}>
                    {isCorrect ? 'Correct' : 'Incorrect'}
                </Badge>
            </motion.div>
        );
    }

    // Active View
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-6 p-6 bg-[#0f1115] rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden relative"
        >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex gap-2">
                    <Badge className="bg-lumina-primary/10 text-lumina-primary hover:bg-lumina-primary/20 border-lumina-primary/20 gap-1.5 py-1 px-3">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {topic}
                    </Badge>
                    <Badge variant="outline" className="border-white/10 text-gray-400 capitalize">
                        {difficulty}
                    </Badge>
                </div>
                {!isSubmitted && <span className="text-xs text-gray-500 font-mono">Select the best answer</span>}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 leading-relaxed tracking-tight whitespace-pre-line">{question}</h3>

            <div className="space-y-3 relative z-10">
                {options.map((opt, i) => {
                    let btnClass = "w-full text-left p-4 rounded-xl text-sm border transition-all duration-300 relative overflow-hidden group ";
                    
                    if (isSubmitted) {
                        if (i === correctIndex) btnClass += "bg-green-500/10 border-green-500/40 text-green-100 ring-1 ring-green-500/50"; 
                        else if (i === selected) btnClass += "bg-red-500/10 border-red-500/40 text-red-100 ring-1 ring-red-500/50"; 
                        else btnClass += "bg-white/5 border-white/5 text-gray-500 opacity-40 grayscale"; 
                    } else {
                        if (i === selected) btnClass += "bg-lumina-primary/10 border-lumina-primary/50 text-white ring-1 ring-lumina-primary/50 shadow-[0_0_15px_rgba(34,197,94,0.1)]";
                        else btnClass += "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:pl-5"; // Indent on hover
                    }

                    return (
                        <button key={i} onClick={() => handleSelect(i)} disabled={isSubmitted} className={btnClass}>
                            <div className="flex items-center gap-4 relative z-10">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border transition-colors ${
                                    isSubmitted && i === correctIndex ? 'bg-green-500 border-green-500 text-black' : 
                                    isSubmitted && i === selected ? 'bg-red-500 border-red-500 text-white' : 
                                    i === selected ? 'bg-lumina-primary border-lumina-primary text-black' :
                                    'border-white/20 text-gray-500 bg-white/5'
                                }`}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className="font-medium">{opt}</span>
                                
                                {isSubmitted && i === correctIndex && <CheckCircle className="w-5 h-5 text-green-500 absolute right-0" />}
                                {isSubmitted && i === selected && i !== correctIndex && <XCircle className="w-5 h-5 text-red-500 absolute right-0" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            <AnimatePresence>
                {!isSubmitted ? (
                    <motion.button 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={handleSubmit} 
                        disabled={selected === null}
                        className="mt-8 w-full py-3.5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
                    >
                        Submit Answer
                    </motion.button>
                ) : (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                        <div className={`p-5 rounded-xl border ${isCorrect ? 'bg-green-950/20 border-green-500/20' : 'bg-red-950/20 border-red-500/20'} mb-6 backdrop-blur-sm`}>
                            <div className="flex items-center gap-2.5 mb-2">
                                {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                <span className={`font-bold text-lg ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                    {isCorrect ? 'Correct!' : 'Incorrect'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed pl-7 border-l-2 border-white/10 ml-0.5">
                                {!isCorrect && (
                                    <span className="block mb-2 font-medium text-green-400">
                                        Correct Answer: {options[correctIndex]}
                                    </span>
                                )}
                                {explanation}
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={handleNext}
                                className="flex-1 py-3.5 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-all shadow-lg hover:shadow-lumina-primary/20 flex items-center justify-center gap-2 group"
                            >
                                Next Question
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button 
                                onClick={handleFinish}
                                className="px-6 py-3.5 bg-white/5 text-gray-300 font-medium rounded-xl hover:bg-white/10 hover:text-white transition-colors border border-white/5 px-8"
                            >
                                Finish
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const FlashcardComponent = ({ front, back, subject }: z.infer<typeof FlashcardSchema>) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  return (
    <div 
        className="my-6 h-64 w-full max-w-md mx-auto cursor-pointer group perspective-1000" 
        onClick={() => setIsFlipped(!isFlipped)}
        style={{ perspective: '1200px' }}
    >
      <motion.div
        className="relative w-full h-full transition-all duration-700 transform-style-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
             <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

             <div className="h-full flex flex-col p-8 relative z-10">
                 <div className="flex justify-between items-center mb-6">
                     <span className="text-[10px] font-bold tracking-[0.2em] text-lumina-primary uppercase border border-lumina-primary/30 px-2 py-1 rounded">Question</span>
                     <span className="text-[10px] text-gray-500 uppercase">{subject}</span>
                     <RotateCcw className="w-4 h-4 text-gray-500 opacity-50 block sm:hidden" />
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight drop-shadow-md">
                        {front}
                    </h3>
                 </div>

                 <div className="mt-6 flex justify-center opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-xs text-gray-300 flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
                        Tap to flip <RotateCcw className="w-3 h-3"/>
                    </span>
                 </div>
             </div>
        </div>

        {/* Back */}
        <div
            className="absolute inset-0 w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#0f0f1a]"
            style={{ transform: 'rotateY(180deg)' }}
        >
             <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
             
             <div className="h-full flex flex-col p-8 relative z-10">
                 <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] font-bold tracking-[0.2em] text-green-400 uppercase border border-green-500/30 px-2 py-1 rounded">Answer</span>
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg md:text-xl text-gray-100 text-center leading-relaxed font-medium">
                        {back}
                    </p>
                 </div>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

const CourseCardComponent = ({ title, code, description, matchScore }: z.infer<typeof CourseCardSchema>) => {
    return (
        <Card className="my-4 bg-white/5 border-white/10 hover:border-purple-500/50 transition-colors group cursor-pointer">
            <CardContent className="p-4 flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-500/40 transition-colors">
                    <PlayCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                         <div>
                            <h4 className="text-white font-semibold truncate group-hover:text-purple-300 transition-colors">{title}</h4>
                            <p className="text-xs text-gray-500 font-mono mb-1">{code}</p>
                         </div>
                         {matchScore && <Badge variant="secondary" className="bg-green-500/10 text-green-400 text-xs">{matchScore}% Match</Badge>}
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">{description}</p>
                </div>
                <div className="flex items-center justify-center pl-2">
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                </div>
            </CardContent>
        </Card>
    )
}

const YoutubeVideoComponent = ({ videoId, title }: z.infer<typeof YoutubeVideoSchema>) => {
    return (
        <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-black/40">
            {title && <div className="p-2 px-3 text-sm text-gray-300 bg-white/5 border-b border-white/5 flex items-center gap-2">
                 <Youtube className="w-4 h-4 text-red-500" /> {title}
            </div>}
            <iframe 
                width="100%" 
                height="315" 
                src={`https://www.youtube.com/embed/${videoId}`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen 
                className="w-full aspect-video"
            ></iframe>
        </div>
    )
}

const CodeBlockComponent = ({ code, language, filename, explanation }: z.infer<typeof CodeBlockSchema>) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
    };

    return (
        <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#1e1e1e]">
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5">
                <span className="text-xs text-gray-400 font-mono">{filename || language}</span>
                <button onClick={handleCopy} className="p-1 hover:text-white text-gray-500 transition-colors">
                    <Copy className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <pre className="text-sm font-mono text-gray-300">
                    <code>{code}</code>
                </pre>
            </div>
            {explanation && (
                <div className="p-3 bg-white/5 border-t border-white/10 text-xs text-gray-400 italic">
                    {explanation}
                </div>
            )}
        </div>
    );
};

const MermaidComponent = ({ chart, title }: z.infer<typeof MermaidSchema>) => {
    const [svg, setSvg] = useState<string>('');
    const id = React.useId().replace(/:/g, ''); 

    React.useEffect(() => {
        const renderChart = async () => {
            try {
                const mermaid = (await import('mermaid')).default;
                mermaid.initialize({ 
                    startOnLoad: false, 
                    theme: 'dark',
                    securityLevel: 'loose',
                });
                
                const { svg } = await mermaid.render(`mermaid-${id}`, chart);
                setSvg(svg);
            } catch (e) {
                console.error("Mermaid Render Error", e);
                setSvg('<div class="text-red-500 text-xs p-2">Failed to render chart</div>');
            }
        };
        renderChart();
    }, [chart, id]);

    return (
        <div className="my-6 rounded-xl border border-white/10 overflow-hidden bg-[#0d1117]">
             <div className="p-2 px-3 text-sm text-gray-300 bg-white/5 border-b border-white/10 flex items-center gap-2 font-mono">
                 <RotateCcw className="w-3 h-3 text-lumina-primary" /> {title}
            </div>
            <div className="p-4 overflow-x-auto flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: svg }} />
            </div>
             {/* Show raw code if failed (heuristically check if svg contains error div) */}
             {svg.includes('text-red-500') && (
                <details className="p-2 border-t border-white/10">
                     <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-white">Debug: Raw Mermaid Code</summary>
                     <pre className="text-[10px] text-gray-500 mt-2 whitespace-pre-wrap font-mono">{chart}</pre>
                </details>
             )}
        </div>
    );
};

const TimelineComponent = ({ title, events }: z.infer<typeof TimelineSchema>) => {
    return (
    <div className="my-8 relative">
        <h3 className="text-center text-lg font-bold text-white mb-8 border-b border-white/10 pb-2 inline-block mx-auto px-8 relative left-1/2 -translate-x-1/2">{title}</h3>
        
        <div className="absolute left-4 md:left-1/2 top-12 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-lumina-primary/50 to-transparent" />
        
        <div className="space-y-8">
            {events.map((ev, i) => {
                const isLeft = i % 2 === 0;
                return (
                    <div key={i} className={`relative flex items-center md:justify-between ${isLeft ? 'flex-row-reverse' : ''}`}>
                        
                        <div className="hidden md:block w-5/12" />

                        <div className="absolute left-4 md:left-1/2 -ml-[5px] w-3 h-3 rounded-full bg-lumina-primary border-2 border-black z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />

                        <div className={`ml-10 md:ml-0 w-full md:w-5/12 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all group ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                            <span className="text-xs font-mono text-lumina-primary/80 block mb-1">{ev.date}</span>
                            <h4 className="text-base font-bold text-white group-hover:text-lumina-primary transition-colors">{ev.title}</h4>
                            <p className="text-sm text-gray-400 mt-2 leading-relaxed">{ev.description}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
)};


const ComparisonTableComponent = ({ title, headers, rows }: z.infer<typeof ComparisonTableSchema>) => {
    // headers[0] is the feature column name
    // headers[1..n] are the item names
    
    return (
    <div className="my-4 rounded-xl border border-white/10 overflow-hidden bg-white/5">
        <div className="p-3 bg-white/5 border-b border-white/10 text-center font-semibold text-white">
            {title}
        </div>
        <div className="grid bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
             {headers.map((h, i) => (
                 <div key={i} className={`p-3 border-r border-white/5 last:border-r-0 ${i === 0 ? 'text-center' : 'text-center'}`}>{h}</div>
             ))}
        </div>
        <div className="divide-y divide-white/5">
            {rows.map((row, i) => (
                <div key={i} className="grid text-sm hover:bg-white/5 transition-colors" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
                    <div className="p-3 border-r border-white/5 text-gray-500 text-xs font-mono flex items-center justify-center font-bold uppercase">{row.feature}</div>
                    {row.values.map((val, j) => (
                        <div key={j} className="p-3 border-r border-white/5 last:border-r-0 text-gray-300 text-center flex items-center justify-center">{val}</div>
                    ))}
                </div>
            ))}
        </div>
    </div>
)};

const ChartComponent = ({ type, title, labels, data, datasetLabel, colors }: z.infer<typeof ChartSchema>) => {
    const chartData = {
        labels,
        datasets: [
            {
                label: datasetLabel,
                data: data,
                backgroundColor: colors || [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(153, 102, 255, 0.5)',
                ],
                borderColor: colors ? colors.map(c => c.replace('0.5', '1')) : [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: 'white' }
            },
            title: {
                display: false,
            },
        },
        scales: (type === 'bar' || type === 'line') ? {
            x: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: 'gray' }, grid: { color: 'rgba(255,255,255,0.1)' } }
        } : undefined
    };

    const renderChart = () => {
        switch (type) {
            case 'bar': return <Bar options={options} data={chartData} />;
            case 'line': return <Line options={options} data={chartData} />;
            case 'pie': return <Pie options={options} data={chartData} />;
            case 'doughnut': return <Doughnut options={options} data={chartData} />;
            default: return null;
        }
    }

    return (
        <Card className="my-4 bg-white/5 border-white/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-lumina-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center">
                {renderChart()}
            </CardContent>
        </Card>
    );
};

const TableComponent = ({ title, headers, rows }: z.infer<typeof TableSchema>) => {
    return (
        <div className="my-4 rounded-xl border border-white/10 overflow-hidden bg-white/5">
            {title && (
                <div className="p-3 bg-white/5 border-b border-white/10 flex items-center gap-2 font-semibold text-white">
                    <TableIcon className="w-4 h-4 text-gray-400" />
                    {title}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-white/5">
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i} className="px-6 py-3">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="px-6 py-4 text-gray-300 font-medium whitespace-pre-wrap">{cell}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PPTDownloadComponent = ({ topic, slideCount, downloadUrl, filename, fileSize, slideData }: z.infer<typeof PPTDownloadSchema>) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    
    // Combine title slide + content slides for carousel
    type Slide = { title: string; bullets: string[]; isTitleSlide?: boolean };
    
    const allSlides: Slide[] = slideData ? [
        { title: slideData.title, bullets: [slideData.subtitle || ''] as string[], isTitleSlide: true },
        ...slideData.slides.map(s => ({ ...s, isTitleSlide: false }))
    ] : [];

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000';
            const fullUrl = `${apiBase}${downloadUrl}`;
            const link = document.createElement('a');
            link.href = fullUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };
    
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-6 p-1 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="p-6">
                <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-16 h-16 rounded-xl bg-lumina-primary/20 flex items-center justify-center shrink-0">
                        <FileText className="w-8 h-8 text-lumina-primary" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">📊 Presentation Ready</h3>
                        <p className="text-gray-400 text-sm">{topic}</p>
                    </div>
                </div>
                
                <div className="flex gap-4 mb-4 relative z-10">
                    <Badge className="bg-white/10 text-gray-300 border-white/20">📄 {slideCount} slides</Badge>
                    {fileSize && <Badge className="bg-white/10 text-gray-300 border-white/20">💾 {fileSize}</Badge>}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-3 relative z-10">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="flex-1 py-3 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-all flex items-center justify-center gap-2 group"
                    >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        {isDownloading ? 'Downloading...' : 'Download PPT'}
                    </button>
                    
                    {slideData && (
                        <button
                            onClick={() => setShowPreview(!showPreview)}
                            className="flex-1 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                            <PlayCircle className="w-4 h-4" />
                            {showPreview ? 'Hide Slides' : 'View Slides'}
                        </button>
                    )}
                </div>
            </div>

            {/* Slide Preview Carousel */}
            <AnimatePresence>
                {showPreview && allSlides.length > 0 && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10 bg-black/20 overflow-hidden"
                    >
                        <div className="p-4">
                            <div className="bg-white rounded-xl aspect-[16/9] w-full relative overflow-hidden shadow-2xl flex flex-col">
                                {/* Slide Header */}
                                <div className={`p-4 border-b-4 ${allSlides[currentSlideIndex].isTitleSlide ? 'bg-lumina-primary h-full flex flex-col justify-center items-center text-center border-none' : 'bg-white border-lumina-primary'}`}>
                                    <h2 className={`${allSlides[currentSlideIndex].isTitleSlide ? 'text-4xl text-white' : 'text-2xl text-black'} font-bold`}>
                                        {allSlides[currentSlideIndex].title}
                                    </h2>
                                    {allSlides[currentSlideIndex].isTitleSlide && (
                                        <p className="text-xl text-white/90 mt-4">{allSlides[currentSlideIndex].bullets[0]}</p>
                                    )}
                                </div>

                                {/* Slide Content (Non-Title) */}
                                {!allSlides[currentSlideIndex].isTitleSlide && (
                                    <div className="p-8 flex-1 bg-gray-50">
                                        <ul className="space-y-4">
                                            {allSlides[currentSlideIndex].bullets.map((bullet, i) => (
                                                <li key={i} className="flex items-start gap-3 text-lg text-gray-800">
                                                    <span className="w-2 h-2 rounded-full bg-lumina-primary mt-2.5 shrink-0" />
                                                    {bullet}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {/* Slide Footer / Controls */}
                                <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-t from-black/50 to-transparent pointer-events-none">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1)); }}
                                        disabled={currentSlideIndex === 0}
                                        className="pointer-events-auto p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-opacity"
                                    >
                                        <ChevronRight className="w-6 h-6 rotate-180" />
                                    </button>
                                    <span className="px-3 py-1 bg-black/50 rounded-full text-white text-xs font-mono">
                                        {currentSlideIndex + 1} / {allSlides.length}
                                    </span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setCurrentSlideIndex(Math.min(allSlides.length - 1, currentSlideIndex + 1)); }}
                                        disabled={currentSlideIndex === allSlides.length - 1}
                                        className="pointer-events-auto p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-opacity"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const ScoreCardComponent = ({ title, score, percentage, correctCount, totalCount, topic, message }: z.infer<typeof ScoreCardSchema>) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="my-6 p-6 bg-[#1a1b26] rounded-xl border border-white/10 relative overflow-hidden"
        >
             {/* Background Glow */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="flex items-center gap-4 mb-6 relative z-10">
                <div className="w-16 h-16 rounded-full bg-lumina-primary/20 flex items-center justify-center shrink-0 border border-lumina-primary/20">
                    <span className="text-3xl">🏆</span>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{title}</h3>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="text-gray-400 border-white/10">{topic}</Badge>
                        <Badge className="bg-lumina-primary/20 text-lumina-primary border-lumina-primary/20">Score: {score}</Badge>
                    </div>
                </div>
            </div>

            <div className="mb-6 relative z-10">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Performance</span>
                    <span className="text-lumina-primary font-bold">{percentage}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                        }`}
                    />
                </div>
            </div>

            <div className="bg-white/5 rounded-xl p-4 mb-4 grid grid-cols-2 gap-4 relative z-10">
                <div className="text-center p-2 border-r border-white/5">
                    <div className="text-3xl font-bold text-green-500 mb-1">{correctCount}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Correct</div>
                </div>
                <div className="text-center p-2">
                    <div className="text-3xl font-bold text-red-500 mb-1">{totalCount - correctCount}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Incorrect</div>
                </div>
            </div>

            <p className="text-gray-300 text-sm text-center italic relative z-10">
                {message || "Great job completing the quiz! Keep learning to improve your score."}
            </p>
        </motion.div>
    );
};

// --- Main Renderer ---

export const A2UIRenderer = ({ content, onAction }: { content: string; onAction?: (action: string, data: any) => void }) => {
  const parts = content.split(/(```a2ui[\s\S]*?```)/g);

  const renderComponent = (data: any, index: number, subIndex: number = 0) => {
        const uniqueKey = `${index}-${subIndex}`;
        
        let component = null;
        let props = data.props;
        
        try {
            switch (data.component) {
              case 'Quiz':
                const quizParsed = QuizSchema.safeParse(props);
                if (quizParsed.success) component = <QuizComponent key={uniqueKey} {...quizParsed.data} onAction={onAction} />;
                else throw new Error(`Invalid Quiz Props: ${quizParsed.error.message}`);
                break;
              case 'Flashcard':
                const fcParsed = FlashcardSchema.safeParse(props);
                if (fcParsed.success) component = <FlashcardComponent key={uniqueKey} {...fcParsed.data} />;
                else throw new Error(`Invalid Flashcard Props: ${fcParsed.error.message}`);
                break;
              case 'CourseCard':
                const ccParsed = CourseCardSchema.safeParse(props);
                if (ccParsed.success) component = <CourseCardComponent key={uniqueKey} {...ccParsed.data} />;
                break;
              case 'YoutubeVideo':
                  const ytParsed = YoutubeVideoSchema.safeParse(props);
                  if (ytParsed.success) component = <YoutubeVideoComponent key={uniqueKey} {...ytParsed.data} />;
                  break;
              case 'CodeBlock':
                  const cbParsed = CodeBlockSchema.safeParse(props);
                  if (cbParsed.success) component = <CodeBlockComponent key={uniqueKey} {...cbParsed.data} />;
                  break;
              case 'Mermaid':
                  const mmParsed = MermaidSchema.safeParse(props);
                  if (mmParsed.success) component = <MermaidComponent key={uniqueKey} {...mmParsed.data} />;
                  break;
              case 'Timeline':
                  const tlParsed = TimelineSchema.safeParse(props);
                  if (tlParsed.success) component = <TimelineComponent key={uniqueKey} {...tlParsed.data} />;
                  break;
              case 'ComparisonTable':
                  const ctParsed = ComparisonTableSchema.safeParse(props);
                  if (ctParsed.success) component = <ComparisonTableComponent key={uniqueKey} {...ctParsed.data} />;
                  break;
              case 'Chart':
                  const chParsed = ChartSchema.safeParse(props);
                  if (chParsed.success) component = <ChartComponent key={uniqueKey} {...chParsed.data} />;
                  break;
              case 'Table':
                  const tbParsed = TableSchema.safeParse(props);
                  if (tbParsed.success) component = <TableComponent key={uniqueKey} {...tbParsed.data} />;
                  break;
              case 'PPTDownload':
                  const pptParsed = PPTDownloadSchema.safeParse(props);
                  if (pptParsed.success) component = <PPTDownloadComponent key={uniqueKey} {...pptParsed.data} />;
                  break;
              case 'ScoreCard':
                  const scParsed = ScoreCardSchema.safeParse(props);
                  if (scParsed.success) component = <ScoreCardComponent key={uniqueKey} {...scParsed.data} />;
                  break;
              default:
                component = (
                    <div key={uniqueKey} className="p-2 border border-yellow-500/50 bg-yellow-500/10 rounded text-xs text-yellow-200 font-mono">
                        Unknown A2UI Component: {data.component}
                    </div>
                );
            }
        } catch (e: any) {
            console.warn("Schema Validation Failed", e);
             component = (
                <div key={uniqueKey} className="p-2 border border-red-500/50 bg-red-500/10 rounded text-xs text-red-200 font-mono">
                    Schema Error: {e.message}
                </div>
            );
        }

        return (
            <A2UIErrorBoundary key={uniqueKey}>
                {component}
            </A2UIErrorBoundary>
        );
  };

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```a2ui')) {
          try {
            const jsonString = part.replace(/^```a2ui\s*/, '').replace(/```$/, '');
            let repaired = jsonString;
            try {
                repaired = jsonrepair(jsonString);
            } catch (repairError) { }

            const parsed = JSON.parse(repaired);
            
            // Support Lists of Components
            if (Array.isArray(parsed)) {
                return (
                    <div key={index} className="space-y-4">
                        {parsed.map((item, subIndex) => renderComponent(item, index, subIndex))}
                    </div>
                );
            } else {
                return renderComponent(parsed, index);
            }

          } catch (e: any) {
             console.error("[A2UI] Global Block Error:", e);
             
             // If the block ends with ``` token, it means it's complete but failed to parse.
             // We should show an error instead of loading spinner forever.
             if (part.trim().endsWith("```")) {
                 return (
                    <div key={index} className="p-2 border border-red-500/30 bg-red-500/10 rounded text-xs text-red-200 font-mono my-2">
                        Failed to render component: {e.message}
                        <br/>
                        <span className="opacity-50 text-[10px]">Check console for details.</span>
                    </div>
                 );
             }
            return (
                <div key={index} className="p-2 border border-blue-500/30 bg-blue-500/10 rounded text-xs text-blue-200 font-mono my-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Generating UI...
                </div>
            );
          }
        } else {
          if (!part.trim()) return null;
          return (
             <div key={index} className={`prose prose-sm max-w-none break-words ${isUser ? 'prose-black text-black' : 'prose-invert text-gray-200'}`}>
                <ReactMarkdown>{part}</ReactMarkdown>
             </div>
          );
        }
      })}
    </>
  );
};
