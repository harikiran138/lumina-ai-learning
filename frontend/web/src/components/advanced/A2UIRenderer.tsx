import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, GraduationCap, ChevronRight, RotateCcw, Youtube, Copy, BarChart3, Table as TableIcon, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
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

// --- A2UI Component Interfaces ---

interface QuizProps {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface FlashcardProps {
  front: string;
  back: string;
}

interface CourseCardProps {
  title: string;
  code: string;
  description: string;
  matchScore?: number;
}

interface YoutubeVideoProps {
  videoId: string;
  title?: string;
}

interface CodeBlockProps {
    code: string;
    language: string;
    filename?: string;
}

interface TimelineProps {
    events: { date: string; title: string; description: string }[];
}

interface ComparisonTableProps {
    title: string;
    headers: [string, string];
    rows: { left: string; right: string; feature: string }[];
}

interface ChartProps {
    type: 'bar' | 'line' | 'pie' | 'doughnut';
    title: string;
    labels: string[];
    data: number[];
    label: string; // Dataset label e.g., "Sales"
    colors?: string[]; // Optional override
}

interface TableProps {
    title?: string;
    headers: string[];
    rows: string[][];
}

// --- Specific Components ---

const QuizComponent = ({ question, options, answers, choices, correctIndex, explanation, onAction }: any) => {
    // [FIX] robust normalization of LLM output
    let finalOptions = options || answers || choices || [];
    let displayQuestion = question;

    // [SELF-HEALING] If no options, try to parse from question string
    if (finalOptions.length === 0 && typeof question === 'string') {
        // Look for patterns like "A) Option" or "1. Option" separated by newlines
        const lines = question.split('\n');
        const extractedOptions: string[] = [];
        const cleanQuestionLines: string[] = [];

        lines.forEach(line => {
            // Support: A) Option, A. Option, 1) Option, 1. Option, - Option, * Option
            const match = line.match(/^([A-D]|[1-4]|-|\*|•)[.)\s-]*\s*(.+)$/i);
            if (match && extractedOptions.length < 10) {
                extractedOptions.push(match[2].trim());
            } else {
                cleanQuestionLines.push(line);
            }
        });

        if (extractedOptions.length >= 2) {
            finalOptions = extractedOptions;
            displayQuestion = cleanQuestionLines.join('\n').trim();
        }
    }
    
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
                    selectedOption: finalOptions[selected],
                    isCorrect: selected === correctIndex
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
                <div className="flex items-center gap-3">
                    {isCorrect ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                    <div>
                        <p className="text-sm font-medium text-gray-300 line-clamp-1">{question}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            You chose: <span className={isCorrect ? "text-green-400" : "text-red-400"}>{finalOptions[selected ?? -1] || "Skipped"}</span>
                        </p>
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
            <div className="flex items-center justify-between mb-6 relative z-10">
                <Badge className="bg-lumina-primary/10 text-lumina-primary hover:bg-lumina-primary/20 border-lumina-primary/20 gap-1.5 py-1 px-3">
                    <GraduationCap className="w-3.5 h-3.5" />
                    Knowledge Check
                </Badge>
                {!isSubmitted && <span className="text-xs text-gray-500 font-mono">Select the best answer</span>}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 leading-relaxed tracking-tight whitespace-pre-line">{displayQuestion}</h3>

            <div className="space-y-3 relative z-10">
                {finalOptions.length === 0 ? (
                    <div className="p-5 rounded-xl border border-white/10 bg-white/5 text-gray-400">
                        <p className="text-sm italic mb-4">I couldn't generate interactive options for this specific question. Feel free to answer in the chat!</p>
                        <details className="text-[10px] font-mono opacity-30 mt-4 border-t border-white/5 pt-2">
                            <summary className="cursor-pointer">Technical Details</summary>
                            {JSON.stringify({ question, options, answers, choices }, null, 2)}
                        </details>
                    </div>
                ) : (
                    finalOptions.map((opt: any, i: number) => {
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
                    })
                )}
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
                            <p className="text-sm text-gray-300 leading-relaxed pl-7 border-l-2 border-white/10 ml-0.5">{explanation}</p>
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

const FlashcardComponent: React.FC<FlashcardProps> = ({ front, back }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  if (!front && !back) return null;
  
  // Safe render helper
  const safeRender = (content: any) => {
      if (typeof content === 'object' && content !== null) {
          return content.value || content.name || JSON.stringify(content);
      }
      return content;
  };

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
             {/* Decorative Elements */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-lumina-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
             <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -ml-12 -mb-12 pointer-events-none"></div>

             <div className="h-full flex flex-col p-8 relative z-10">
                 <div className="flex justify-between items-center mb-6">
                     <span className="text-[10px] font-bold tracking-[0.2em] text-lumina-primary uppercase border border-lumina-primary/30 px-2 py-1 rounded">Question</span>
                     <RotateCcw className="w-4 h-4 text-gray-500 opacity-50 block sm:hidden" />
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center">
                    <h3 className="text-2xl md:text-3xl font-bold text-white text-center leading-tight drop-shadow-md">
                        {safeRender(front)}
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
             {/* Decorative Background */}
             <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
             
             <div className="h-full flex flex-col p-8 relative z-10">
                 <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] font-bold tracking-[0.2em] text-green-400 uppercase border border-green-500/30 px-2 py-1 rounded">Answer</span>
                 </div>
                 
                 <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg md:text-xl text-gray-100 text-center leading-relaxed font-medium">
                        {safeRender(back)}
                    </p>
                 </div>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

const CourseCardComponent: React.FC<CourseCardProps> = ({ title, code, description, matchScore }) => {
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

const YoutubeVideoComponent: React.FC<YoutubeVideoProps> = ({ videoId, title }) => {
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

const CodeBlockComponent: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
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
        </div>
    );
};

// --- Specific Components ---

const MermaidComponent: React.FC<{ chart: string }> = ({ chart }) => {
    if (!chart) return null;
    const [svg, setSvg] = useState<string>('');
    const id = React.useId().replace(/:/g, ''); // Unique ID for multiple charts

    React.useEffect(() => {
        const renderChart = async () => {
            try {
                // Dynamic import to avoid SSR issues
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
        <div className="my-6 p-4 bg-[#0d1117] rounded-xl border border-white/10 overflow-x-auto flex justify-center">
            <div dangerouslySetInnerHTML={{ __html: svg }} />
        </div>
    );
};

// ... (Quiz, Flashcard, etc. remain)

const TimelineComponent: React.FC<TimelineProps> = ({ events = [] }) => {
    if (!events || events.length === 0) return null;
    return (
    <div className="my-8 relative">
        {/* Center Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-lumina-primary/50 to-transparent" />
        
        <div className="space-y-8">
            {events.map((ev, i) => {
                const isLeft = i % 2 === 0;
                return (
                    <div key={i} className={`relative flex items-center md:justify-between ${isLeft ? 'flex-row-reverse' : ''}`}>
                        
                        {/* Empty Space for alignment */}
                        <div className="hidden md:block w-5/12" />

                        {/* Dot */}
                        <div className="absolute left-4 md:left-1/2 -ml-[5px] w-3 h-3 rounded-full bg-lumina-primary border-2 border-black z-10 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />

                        {/* Content Card */}
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

const ComparisonTableComponent: React.FC<ComparisonTableProps> = ({ title, headers = [], rows = [] }) => {
    const safeRender = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
            return val.value || val.text || val.name || JSON.stringify(val);
        }
        return String(val);
    };

    const headerLeft = headers[0] || 'Left';
    const headerRight = headers[1] || 'Right';

    return (
    <div className="my-4 rounded-xl border border-white/10 overflow-hidden bg-white/5">
        <div className="p-3 bg-white/5 border-b border-white/10 text-center font-semibold text-white">
            {title}
        </div>
        <div className="grid grid-cols-3 bg-white/5 text-xs font-bold text-gray-400 uppercase tracking-wider">
             <div className="p-3 border-r border-white/5">{safeRender(headerLeft)}</div>
             <div className="p-3 border-r border-white/5 text-center">Feature</div>
             <div className="p-3">{safeRender(headerRight)}</div>
        </div>
        <div className="divide-y divide-white/5">
            {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-3 text-sm hover:bg-white/5 transition-colors">
                    <div className="p-3 border-r border-white/5 text-gray-300">{safeRender(row.left)}</div>
                    <div className="p-3 border-r border-white/5 text-center text-gray-500 text-xs font-mono flex items-center justify-center">{safeRender(row.feature)}</div>
                    <div className="p-3 text-gray-300">{safeRender(row.right)}</div>
                </div>
            ))}
        </div>
    </div>
)};

const ChartComponent: React.FC<ChartProps> = ({ type, title, labels = [], data = [], label, colors }) => {
    const chartData = {
        labels,
        datasets: [
            {
                label: label,
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

const TableComponent: React.FC<TableProps> = ({ title, headers, rows }) => {
    const safeRender = (val: any) => {
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') {
            return val.value || val.text || val.name || JSON.stringify(val);
        }
        return String(val);
    };

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
                                <th key={i} className="px-6 py-3">{safeRender(h)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                {row.map((cell, j) => (
                                    <td key={j} className="px-6 py-4 text-gray-300 font-medium whitespace-pre-wrap">{safeRender(cell)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main Renderer ---

export const A2UIRenderer = ({ content, onAction }: { content: string; onAction?: (action: string, data: any) => void }) => {
  const parts = content.split(/(```a2ui[\s\S]*?```)/g);

  const renderComponent = (data: any, index: number, subIndex: number = 0) => {
        const uniqueKey = `${index}-${subIndex}`;
        switch (data.component) {
          case 'Quiz':
            return <QuizComponent key={uniqueKey} {...data.props} onAction={onAction} />;
          case 'Flashcard':
            return <FlashcardComponent key={uniqueKey} {...data.props} />;
          case 'CourseCard':
            return <CourseCardComponent key={uniqueKey} {...data.props} />;
          case 'YoutubeVideo':
              return <YoutubeVideoComponent key={uniqueKey} {...data.props} />;
          case 'CodeBlock':
              return <CodeBlockComponent key={uniqueKey} {...data.props} />;
          case 'Mermaid':
              return <MermaidComponent key={uniqueKey} {...data.props} />;
          case 'Timeline':
              return <TimelineComponent key={uniqueKey} {...data.props} />;
          case 'ComparisonTable':
              return <ComparisonTableComponent key={uniqueKey} {...data.props} />;
          case 'Chart':
              return <ChartComponent key={uniqueKey} {...data.props} />;
          case 'Table':
              return <TableComponent key={uniqueKey} {...data.props} />;
          default:
            return (
                <div key={uniqueKey} className="p-2 border border-yellow-500/50 bg-yellow-500/10 rounded text-xs text-yellow-200 font-mono">
                    Unknown A2UI Component: {data.component}
                </div>
            );
        }
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

          } catch (e) {
            return (
                <div key={index} className="p-2 border border-blue-500/30 bg-blue-500/10 rounded text-xs text-blue-200 font-mono my-2 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" /> Generating UI...
                </div>
            );
          }
        } else {
          if (!part.trim()) return null;
          return (
             <div key={index} className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{part}</ReactMarkdown>
             </div>
          );
        }
      })}
    </>
  );
};
