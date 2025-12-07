'use client';

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import {
    Upload,
    FileText,
    Loader2,
    CheckCircle,
    BookOpen,
    Layers,
    Save,
    ArrowRight,
    Play,
    Edit2,
    Trash2,
    Plus,
    Sparkles,
    Key
} from 'lucide-react';

interface ContentBlock {
    type: 'paragraph' | 'list' | 'code' | 'warning' | 'tip';
    content: string;
}

interface Subtopic {
    title: string;
    content: ContentBlock[];
}

interface Topic {
    title: string;
    goal: string;
    content: ContentBlock[]; // Main topic content
    subtopics?: Subtopic[]; // Optional deep dive
}

interface Module {
    title: string;
    summary: string;
    topics: Topic[];
}

export default function CourseGeneratorPage() {
    // AI State
    const [aiProgress, setAiProgress] = useState('');

    // Flow State
    const [step, setStep] = useState<'upload' | 'analyzing' | 'review' | 'saving' | 'done'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [modules, setModules] = useState<Module[]>([]);
    const [creationProgress, setCreationProgress] = useState(0);

    // API State
    const [savingStatus, setSavingStatus] = useState('');
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

    // Dynamic Import wrapper for server action interaction if needed, but direct import is fine for updated Next.js
    // We import generateCourseStructure from '@/app/actions/gemini' at top level if not "use server" conflict
    // But since this is client component, we rely on the import we will add.

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
            setCourseTitle(e.target.files[0].name.replace('.pdf', '').replace('.txt', ''));
        }
    };

    // AI Engine State
    const engine = useRef<any>(null);
    const [isEngineReady, setIsEngineReady] = useState(false);
    const [engineProgress, setEngineProgress] = useState('');

    // Preload WebLLM Engine
    useEffect(() => {
        const initEngine = async () => {
            // Dynamic import to avoid SSR issues
            const { CreateMLCEngine } = await import("@mlc-ai/web-llm");

            // Using Llama 3.2 3B - Good balance of JSON capability and size (~2GB)
            // 1B is too weak for complex schema.
            const selectedModel = "Llama-3.2-3B-Instruct-q4f16_1-MLC";

            try {
                setEngineProgress('Downloading AI Model (this happens once)...');
                engine.current = await CreateMLCEngine(
                    selectedModel,
                    {
                        initProgressCallback: (report) => {
                            setEngineProgress(report.text);
                        }
                    }
                );
                setIsEngineReady(true);
                setEngineProgress('AI Model Ready');
            } catch (err) {
                console.error("Failed to load WebLLM:", err);
                setEngineProgress('Failed to load AI Model. Check connection.');
            }
        };
        initEngine();
    }, []);

    const startAnalysis = async () => {
        if (!file || !isEngineReady || !engine.current) {
            if (!isEngineReady) alert("Please wait for the AI Model to finish loading.");
            return;
        }

        setStep('analyzing');
        setAiProgress('Preparing Document...');

        try {
            // Import Pipeline Tools
            const { chunkPages, extractSectionsFromChunk, mergeSectionsToCourse } = await import('@/lib/ai-pipeline');

            // 1. Robust PDF Extraction (Client Side)
            let pages: { page: number, text: string }[] = [];

            if (file.type === 'application/pdf') {
                const fullText = await extractTextFromPDF(file);
                pages = [{ page: 1, text: fullText }];
            } else {
                const text = await file.text();
                pages = [{ page: 1, text: text }];
            }

            // 2. Chunking
            setAiProgress('Chunking Content...');
            const chunks = chunkPages(pages, 8000); // 8k chars safe for 3B context
            console.log(`Created ${chunks.length} chunks.`);

            // 3. Pass 1: Extract Sections from Chunks
            let allSections: any[] = [];

            for (let i = 0; i < chunks.length; i++) {
                setAiProgress(`Analyzing Chunk ${i + 1}/${chunks.length} (Pass 1: Structuring)...`);
                // Using WebLLM engine instance
                const result = await extractSectionsFromChunk(chunks[i].text, engine.current);
                if (result && result.sections) {
                    allSections = [...allSections, ...result.sections];
                }
            }

            if (allSections.length === 0) {
                throw new Error("Could not extract any valid content from the document.");
            }

            // 4. Pass 2: Merge into Course
            setAiProgress('Merging into Final Course Structure (Pass 2: Organization)...');
            const courseStructure = await mergeSectionsToCourse(allSections, engine.current);

            if (courseStructure && courseStructure.modules) {
                setModules(courseStructure.modules);
                setStep('review');
            } else {
                throw new Error("Failed to merge content into a valid course.");
            }

        } catch (e: any) {
            console.error(e);
            alert("Analysis failed: " + e.message);
            setStep('upload');
        }
    };

    const saveCourse = async () => {
        setStep('saving');
        setSavingStatus('Creating Course...');
        try {
            // Transform AI modules to match DB schema (Topic -> Lesson)
            const dbModules = modules.map((mod, idx) => ({
                id: `mod-${Date.now()}-${idx}`,
                title: mod.title,
                duration: `${mod.topics.length * 10} min`, // Estimate
                lessons: mod.topics.map((topic, tIdx) => ({
                    id: `less-${Date.now()}-${tIdx}`,
                    title: topic.title,
                    type: 'text', // AI content is text/rich-text
                    duration: '10 min',
                    // Serialize the rich content structure so the student view can JSON.parse it
                    content: JSON.stringify({
                        goal: topic.goal,
                        content: topic.content,
                        subtopics: topic.subtopics
                    })
                }))
            }));

            const result = await api.createCourse({
                title: courseTitle,
                description: courseDescription,
                modules: dbModules,
                image: '/api/placeholder/400/320'
            });

            if (result.success && result.courseId) {
                setCreatedCourseId(result.courseId);
                setStep('done');
            } else {
                throw new Error("Failed to save");
            }

        } catch (e) {
            alert("Failed to save course");
            setStep('review');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen text-white">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                        <Sparkles className="w-8 h-8 text-blue-400" />
                        AI Course Generator
                    </h1>
                    <p className="text-gray-400 mt-2">Upload your textbook or notes (PDF/TXT) and let AI build the course.</p>
                </div>
            </div>

            {step === 'upload' && (
                <div className="glass-card p-8 text-center space-y-6">
                    <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 hover:border-lumina-primary/50 transition-colors">
                        <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-white mb-2">Upload Textbook</h3>
                        <p className="text-gray-400 mb-6">Support for PDF or Text files.</p>

                        <input
                            type="file"
                            accept=".pdf,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg cursor-pointer font-medium transition-colors"
                        >
                            Select File
                        </label>
                        {file && <p className="mt-4 text-lumina-primary font-mono">{file.name}</p>}
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-left hidden">
                        {/* API Key managed via server env */}
                    </div>

                    <button
                        onClick={startAnalysis}
                        disabled={!file}
                        className="w-full py-4 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        Analyze Structure
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Step 2: Analyzing */}
            {step === 'analyzing' && (
                <div className="glass-card p-12 text-center">
                    <Loader2 className="w-16 h-16 text-lumina-primary animate-spin mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Analyzing Content</h3>
                    <p className="text-gray-400 mb-6">{aiProgress}</p>

                    <div className="max-w-md mx-auto h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-lumina-primary animate-pulse w-2/3"></div>
                    </div>

                    <p className="text-xs text-gray-500 mt-4 max-w-md mx-auto">
                        Lumina is reading your document and identifying the learning structure...
                    </p>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 'review' && (
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Course Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Title</label>
                                <input
                                    value={courseTitle}
                                    onChange={e => setCourseTitle(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Description</label>
                                <textarea
                                    value={courseDescription}
                                    onChange={e => setCourseDescription(e.target.value)}
                                    placeholder="Enter course overview..."
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white h-24"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-lumina-primary" />
                            Proposed Structure
                        </h3>
                        <div className="space-y-4">
                            {modules.map((mod, mIdx) => (
                                <div key={mIdx} className="border border-white/10 rounded-xl overflow-hidden">
                                    <div className="bg-white/5 p-3 flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-xs text-gray-400">{mIdx + 1}</div>
                                        <input
                                            value={mod.title}
                                            onChange={e => {
                                                const newMods = [...modules];
                                                newMods[mIdx].title = e.target.value;
                                                setModules(newMods);
                                            }}
                                            className="bg-transparent border-none text-white font-medium focus:outline-none flex-1"
                                        />
                                        <button
                                            onClick={() => {
                                                const newMods = [...modules];
                                                newMods.splice(mIdx, 1);
                                                setModules(newMods);
                                            }}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="p-3 pl-12 space-y-2 bg-black/20">
                                        <div className="space-y-4">
                                            {mod.topics.map((topic, tIdx) => (
                                                <div key={tIdx} className="bg-black/20 p-4 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                                                    {/* Topic Header */}
                                                    <div className="flex justify-between items-center mb-2">
                                                        <input
                                                            value={topic.title}
                                                            onChange={e => {
                                                                const newMods = [...modules];
                                                                newMods[mIdx].topics[tIdx].title = e.target.value;
                                                                setModules(newMods);
                                                            }}
                                                            className="bg-transparent border-none text-gray-200 text-sm font-bold focus:outline-none flex-1"
                                                            placeholder="Topic Title"
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const newMods = [...modules];
                                                                newMods[mIdx].topics.splice(tIdx, 1);
                                                                setModules(newMods);
                                                            }}
                                                            className="text-gray-600 hover:text-red-400 opacity-60 hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </button>
                                                    </div>

                                                    {/* Topic Goal */}
                                                    <input
                                                        value={topic.goal || ''}
                                                        onChange={e => {
                                                            const newMods = [...modules];
                                                            newMods[mIdx].topics[tIdx].goal = e.target.value;
                                                            setModules(newMods);
                                                        }}
                                                        className="w-full bg-transparent text-xs text-lumina-primary mb-3 focus:outline-none"
                                                        placeholder="Goal: Student will learn..."
                                                    />

                                                    {/* Content Blocks */}
                                                    <div className="space-y-2 mb-4">
                                                        {topic.content.map((block, bIdx) => (
                                                            <div key={bIdx} className="relative group">
                                                                <textarea
                                                                    value={block.content}
                                                                    onChange={e => {
                                                                        const newMods = [...modules];
                                                                        newMods[mIdx].topics[tIdx].content[bIdx].content = e.target.value;
                                                                        setModules(newMods);
                                                                    }}
                                                                    className={`w-full bg-transparent border-none text-sm focus:outline-none resize-none overflow-hidden ${block.type === 'code' ? 'font-mono bg-black/40 p-2 rounded text-blue-300' :
                                                                        block.type === 'list' ? 'pl-4 border-l-2 border-gray-600' :
                                                                            block.type === 'tip' ? 'bg-blue-500/10 p-2 rounded text-blue-200 italic' :
                                                                                'text-gray-300'
                                                                        }`}
                                                                    rows={block.type === 'code' || block.type === 'list' ? 4 : 2}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Subtopics */}
                                                    {topic.subtopics && topic.subtopics.length > 0 && (
                                                        <div className="ml-4 pl-4 border-l border-white/10 space-y-3 mt-4">
                                                            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Deep Dive</div>
                                                            {topic.subtopics.map((sub, sIdx) => (
                                                                <div key={sIdx} className="bg-white/5 p-3 rounded">
                                                                    <input
                                                                        value={sub.title}
                                                                        onChange={e => {
                                                                            const newMods = [...modules];
                                                                            if (newMods[mIdx].topics[tIdx].subtopics) {
                                                                                newMods[mIdx].topics[tIdx].subtopics![sIdx].title = e.target.value;
                                                                                setModules(newMods);
                                                                            }
                                                                        }}
                                                                        className="bg-transparent border-none text-gray-300 text-xs font-semibold focus:outline-none w-full"
                                                                    />
                                                                    <div className="mt-2 space-y-2">
                                                                        {sub.content.map((block, bIdx) => (
                                                                            <textarea
                                                                                key={bIdx}
                                                                                value={block.content}
                                                                                onChange={e => {
                                                                                    const newMods = [...modules];
                                                                                    if (newMods[mIdx].topics[tIdx].subtopics) {
                                                                                        newMods[mIdx].topics[tIdx].subtopics![sIdx].content[bIdx].content = e.target.value;
                                                                                        setModules(newMods);
                                                                                    }
                                                                                }}
                                                                                className="w-full bg-transparent text-xs text-gray-400 focus:outline-none resize-none"
                                                                                rows={2}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const newMods = [...modules];
                                                    newMods[mIdx].topics.push({ title: "New Topic", goal: "Learning Outcome", content: [{ type: 'paragraph', content: "Content here..." }] });
                                                    setModules(newMods);
                                                }}
                                                className="text-xs text-lumina-primary hover:underline flex items-center gap-1 mt-2 ml-1"
                                            >
                                                <Plus className="w-3 h-3" /> Add Topic
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setModules([...modules, { title: "New Module", summary: "", topics: [] }])}
                                className="w-full py-3 border border-dashed border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-colors mt-4"
                            >
                                + Add Module
                            </button>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={saveCourse}
                                className="flex-1 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2 border border-white/10"
                            >
                                <Save className="w-5 h-5" />
                                Save as Draft
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Saving / Done */}
            {(step === 'saving' || step === 'done') && (
                <div className="glass-card p-12 text-center">
                    {step === 'saving' ? (
                        <>
                            <Loader2 className="w-16 h-16 text-lumina-primary animate-spin mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Saving Draft...</h3>
                            <p className="text-gray-400 mb-4">{savingStatus}</p>

                            <div className="max-w-md mx-auto">
                                <div className="flex justify-between text-xs text-blue-300 mb-1">
                                    <span>Progress</span>
                                    <span>{creationProgress}%</span>
                                </div>
                                <div className="h-4 bg-black/40 rounded-full overflow-hidden border border-white/10">
                                    <div
                                        className="h-full bg-gradient-to-r from-lumina-primary to-blue-500 transition-all duration-300"
                                        style={{ width: `${creationProgress}% ` }}
                                    ></div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">Draft Saved!</h3>
                            <p className="text-gray-400 mb-8">"{courseTitle}" is now a draft.</p>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={async () => {
                                        if (createdCourseId) {
                                            setSavingStatus('Publishing...');
                                            await api.publishCourse(createdCourseId);
                                            alert("Course Published Successfully!");
                                            window.location.href = '/teacher/courses';
                                        }
                                    }}
                                    className="px-6 py-3 bg-green-500 text-black font-bold rounded-xl hover:bg-green-400 flex items-center gap-2"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Publish Now
                                </button>
                                <a href="/teacher/courses" className="px-6 py-3 bg-white/10 rounded-xl text-white hover:bg-white/20 border border-white/10">
                                    Return to Courses
                                </a>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function SparklesIcon(props: any) {
    return <Sparkles {...props} />;
}
