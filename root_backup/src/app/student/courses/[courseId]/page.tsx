'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import {
    BookOpen,
    Search,
    Filter,
    Clock,
    MoreVertical,
    PlayCircle,
    CheckCircle,
    HelpCircle,
    X,
    Trophy,
    Star,
    ChevronDown,
    ChevronUp,
    Users,
    LayoutDashboard, // Added missing import
    Bot
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CourseDetails({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState<number | null>(0);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [activeLesson, setActiveLesson] = useState<any>(null);
    // Track active lesson by unique composite index to handle duplicate IDs in seed data
    const [activeLessonIndex, setActiveLessonIndex] = useState<{ m: number, l: number } | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Added for slides
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [showAIHelp, setShowAIHelp] = useState(false); // AI Modal State
    const [aiChatInput, setAiChatInput] = useState('');
    const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [aiIsTyping, setAiIsTyping] = useState(false);

    const handleSendAIQuestion = async () => {
        if (!aiChatInput.trim()) return;

        const userMsg = aiChatInput;
        setAiChatInput('');
        setAiChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
        setAiIsTyping(true);

        try {
            // Construct context from active lesson
            const context = activeLesson ? `Context: You are an AI tutor helping a student with the lesson "${activeLesson.title}". Content: ${activeLesson.content || activeLesson.description || "No text content available."}` : "You are a helpful tutor.";

            const messages = [
                { role: 'system', content: context },
                ...aiChatHistory.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: userMsg }
            ];

            const response = await api.chatWithAI(messages); // Assuming this returns string or { content: string }
            const aiText = typeof response === 'string' ? response : response.content || "I couldn't understand that.";

            setAiChatHistory(prev => [...prev, { role: 'assistant', content: aiText }]);
        } catch (e) {
            setAiChatHistory(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my brain right now." }]);
        } finally {
            setAiIsTyping(false);
        }
    };

    useEffect(() => {
        const fetchCourse = async () => {
            if (courseId) {
                const data = await api.getCourseDetails(courseId);
                setCourse(data);
            }
            setIsLoading(false);
        };
        fetchCourse();
    }, [courseId]);


    const handleLessonSelect = async (lesson: any, mIdx: number, lIdx: number) => {
        if (lesson.type === 'quiz') {
            setActiveQuiz(lesson);
            setActiveLesson(null);
            setActiveLessonIndex(null);
            setQuizAnswers({});
            setQuizSubmitted(false);
            setQuizScore(0);
            setCurrentQuestionIndex(0); // Reset to first question
        } else {
            // Toggle if already active
            if (activeLessonIndex?.m === mIdx && activeLessonIndex?.l === lIdx) {
                setActiveLesson(null);
                setActiveLessonIndex(null);
                return;
            }

            // Set active text/video lesson
            setActiveLesson(lesson);
            setActiveLessonIndex({ m: mIdx, l: lIdx });
            setActiveQuiz(null);
            setCurrentSlideIndex(0); // Reset slides

            // Mark lesson as started/complete in DB (optional: for now just log locally or simple ping)
            await api.updateProgress(courseId, 5);
        }
    };

    const nextSlide = () => {
        if (activeLesson && activeLesson.slides && currentSlideIndex < activeLesson.slides.length - 1) {
            setCurrentSlideIndex(prev => prev + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(prev => prev - 1);
        }
    };

    const handleQuizOptionSelect = (questionId: string, optionIndex: number) => {
        if (quizSubmitted) return;
        setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < activeQuiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const submitQuiz = async () => {
        if (!activeQuiz) return;
        let score = 0;
        activeQuiz.questions.forEach((q: any) => {
            if (quizAnswers[q.id] === q.correctAnswer) {
                score++;
            }
        });
        setQuizScore(score);
        setQuizSubmitted(true);

        try {
            await api.updateProgress(courseId, 10);
        } catch (e) {
            console.error("Failed to sync progress");
        }
    };

    const closeQuiz = () => {
        setActiveQuiz(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
        setCurrentQuestionIndex(0);
    };

    if (isLoading) return <div className="text-white text-center p-20">Loading course details...</div>;
    if (!course) return <div className="text-white text-center p-20">Course not found.</div>;

    const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
    const isLastQuestion = activeQuiz && currentQuestionIndex === activeQuiz.questions.length - 1;

    return (
        <div className="space-y-8 relative">
            {/* Quiz Modal Container */}
            {activeQuiz && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-lumina-primary/10 relative overflow-hidden">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-lumina-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        {/* Valid Header */}
                        <div className="p-8 border-b border-white/10 flex justify-between items-center relative z-10">
                            <div>
                                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                    <HelpCircle className="text-lumina-primary w-6 h-6" />
                                    {activeQuiz.title}
                                </h3>
                                {!quizSubmitted && (
                                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-400">
                                        <span>Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}</span>
                                        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-lumina-primary transition-all duration-300"
                                                style={{ width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <button onClick={closeQuiz} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto relative z-10">
                            {!quizSubmitted && currentQuestion ? (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300" key={currentQuestion.id}>
                                    <h4 className="text-xl font-medium text-white leading-relaxed">
                                        {currentQuestion.question}
                                    </h4>
                                    <div className="space-y-3">
                                        {currentQuestion.options.map((option: string, optIdx: number) => (
                                            <button
                                                key={optIdx}
                                                onClick={() => handleQuizOptionSelect(currentQuestion.id, optIdx)}
                                                className={`w-full text-left p-5 rounded-2xl border-2 transition-all flex items-center justify-between group ${quizAnswers[currentQuestion.id] === optIdx
                                                    ? 'border-lumina-primary bg-lumina-primary/10 text-white shadow-[0_0_20px_rgba(255,215,0,0.1)]'
                                                    : 'border-white/5 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                            >
                                                <span className="text-lg">{option}</span>
                                                {quizAnswers[currentQuestion.id] === optIdx && (
                                                    <CheckCircle className="w-6 h-6 text-lumina-primary" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 flex flex-col items-center justify-center h-full animate-in zoom-in-95 duration-500">
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-lumina-primary/20 blur-xl rounded-full"></div>
                                        <Trophy className="w-24 h-24 text-lumina-primary relative z-10" />
                                    </div>
                                    <h4 className="text-4xl font-bold text-white mb-4">Quiz Completed!</h4>
                                    <p className="text-xl text-gray-300 mb-8">
                                        You scored <span className="text-lumina-primary font-bold text-2xl">{quizScore}</span> / {activeQuiz.questions.length}
                                    </p>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 text-amber-400">
                                        <Star className="w-4 h-4 fill-amber-400" />
                                        <span className="font-bold">+{quizScore * 50} XP Earned</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-white/10 mt-auto bg-black/20 relative z-10 flex justify-between gap-4">
                            {!quizSubmitted ? (
                                <>
                                    <button
                                        onClick={handlePrevQuestion}
                                        disabled={currentQuestionIndex === 0}
                                        className={`px-6 py-3 rounded-xl font-medium transition-all ${currentQuestionIndex === 0
                                            ? 'text-gray-600 cursor-not-allowed'
                                            : 'text-white hover:bg-white/10'
                                            }`}
                                    >
                                        Previous
                                    </button>

                                    {isLastQuestion ? (
                                        <button
                                            onClick={submitQuiz}
                                            disabled={Object.keys(quizAnswers).length !== activeQuiz.questions.length}
                                            className="px-8 py-3 bg-gradient-to-r from-lumina-primary to-amber-500 text-black font-bold rounded-xl hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                                        >
                                            Submit Quiz
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleNextQuestion}
                                            className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 hover:scale-105 transition-all"
                                        >
                                            Next Question
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={closeQuiz}
                                    className="w-full py-4 bg-white/10 text-white font-bold rounded-2xl hover:bg-white/20 transition-all"
                                >
                                    Close Results
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden glass-card">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent z-10"></div>
                <img src={course.thumbnail || "/api/placeholder/1200/400"} alt={course.name} className="w-full h-80 object-cover" />

                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end">
                    <span className="px-3 py-1 bg-lumina-primary text-black text-xs font-bold rounded-full w-fit mb-4">
                        COURSE
                    </span>
                    <h1 className="text-4xl font-bold text-white mb-2">{course.name}</h1>
                    <p className="text-xl text-gray-200 mb-6 max-w-2xl">{course.description}</p>

                    <div className="flex items-center gap-6 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <span className="text-white font-medium">{course.rating}</span>
                            <span>(1.2k reviews)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{course.students} Students</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8 relative">
                    {/* Enrollment: Basic check simulated by access. 
                        To be robust: if (!course.isEnrolled) return <EnrollmentGate /> 
                     */}

                    {/* Contextual AI Helper Trigger */}
                    {activeLesson && (
                        <div className="mb-4 flex justify-end">
                            <button
                                onClick={() => setShowAIHelp(true)}
                                className="text-xs flex items-center gap-2 bg-lumina-primary/10 text-lumina-primary px-3 py-1.5 rounded-full border border-lumina-primary/20 hover:bg-lumina-primary/20 transition-colors"
                            >
                                <Bot className="w-4 h-4" />
                                Ask AI about this lesson
                            </button>
                        </div>
                    )}

                    {/* AI Help Modal */}
                    {showAIHelp && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col h-[500px]">
                                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 rounded-t-2xl">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-lumina-primary" />
                                        AI Tutor: {activeLesson?.title}
                                    </h3>
                                    <button onClick={() => setShowAIHelp(false)} className="text-gray-400 hover:text-white">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto space-y-4 font-sans text-sm">
                                    <div className="bg-white/5 p-3 rounded-xl rounded-tl-none">
                                        <p className="text-gray-300">Hi! I'm your AI tutor for this lesson. I have context about "{activeLesson?.title}". What's confusing you?</p>
                                    </div>

                                    {aiChatHistory.map((msg, idx) => (
                                        <div key={idx} className={`${msg.role === 'user' ? 'bg-lumina-primary/10 ml-auto border-lumina-primary/20 rounded-tr-none' : 'bg-white/5 rounded-tl-none'} p-3 rounded-xl max-w-[80%] border ${msg.role === 'user' ? 'border' : 'border-transparent'}`}>
                                            <p className={msg.role === 'user' ? 'text-white' : 'text-gray-300'}>{msg.content}</p>
                                        </div>
                                    ))}

                                    {aiIsTyping && (
                                        <div className="bg-white/5 p-3 rounded-xl rounded-tl-none w-fit">
                                            <span className="animate-pulse text-gray-400">Thinking...</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-white/10 bg-white/5 rounded-b-2xl">
                                    <div className="flex gap-2">
                                        <input
                                            value={aiChatInput}
                                            onChange={(e) => setAiChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendAIQuestion()}
                                            placeholder="Ask a question..."
                                            className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-lumina-primary/50"
                                        />
                                        <button
                                            onClick={handleSendAIQuestion}
                                            disabled={aiIsTyping || !aiChatInput.trim()}
                                            className="p-2 bg-lumina-primary text-black rounded-xl hover:bg-lumina-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}



                    {/* Module List (Always Visible) */}
                    <div className="glass-card p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Course Content</h2>
                            <span className="text-sm text-gray-400">{course.modules?.length || 0} Modules</span>
                        </div>

                        <div className="space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map((module: any, i: number) => (
                                    <div key={module.id || i} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                                        <button
                                            onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-8 h-8 rounded-full bg-lumina-primary/20 flex items-center justify-center text-lumina-primary font-bold text-sm">
                                                    {i + 1}
                                                </div>
                                                <div className="text-left">
                                                    <h3 className="font-medium text-white text-lg">{module.title}</h3>
                                                    <p className="text-xs text-gray-400">{module.lessons?.length || 0} lessons • {module.duration}</p>
                                                </div>
                                            </div>
                                            {expandedModule === i ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                                        </button>

                                        {expandedModule === i && (
                                            <div className="border-t border-white/10 bg-black/20">
                                                {module.lessons?.map((lesson: any, lIdx: number) => (
                                                    <div
                                                        key={lIdx}
                                                        className="border-b border-white/5 last:border-0"
                                                    >
                                                        <div
                                                            onClick={() => handleLessonSelect(lesson, i, lIdx)}
                                                            className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer group ${activeLessonIndex?.m === i && activeLessonIndex?.l === lIdx ? 'bg-lumina-primary/10 border-l-2 border-l-lumina-primary' : ''
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                {lesson.type === 'quiz' ? (
                                                                    <HelpCircle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                                                                ) : lesson.type === 'slides' ? (
                                                                    <LayoutDashboard className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                                                                ) : (
                                                                    <BookOpen className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                                )}
                                                                <span className={`transition-colors ${activeLessonIndex?.m === i && activeLessonIndex?.l === lIdx ? 'text-lumina-primary font-medium' : 'text-gray-300 group-hover:text-white'}`}>
                                                                    {lesson.title}
                                                                </span>
                                                            </div>
                                                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                                                {lesson.duration}
                                                            </span>
                                                        </div>

                                                        {/* Inline Content Viewer */}
                                                        {activeLessonIndex?.m === i && activeLessonIndex?.l === lIdx && (
                                                            <div className="p-6 bg-black/30 border-t border-white/5 animate-in slide-in-from-top-2 duration-200">
                                                                {/* Slides Viewer */}
                                                                {activeLesson.type === 'slides' && activeLesson.slides && (
                                                                    <div className="bg-black/40 rounded-2xl border border-white/10 overflow-hidden mb-6">
                                                                        <div className="aspect-[16/9] relative bg-gray-900 group">
                                                                            <img
                                                                                src={activeLesson.slides[currentSlideIndex]?.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
                                                                                alt="Slide"
                                                                                className="w-full h-full object-cover opacity-80"
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8">
                                                                                <h2 className="text-3xl font-bold text-white mb-2">{activeLesson.slides[currentSlideIndex]?.title}</h2>
                                                                                <p className="text-xl text-gray-200 max-w-2xl">{activeLesson.slides[currentSlideIndex]?.text}</p>
                                                                            </div>

                                                                            {/* Navigation Overlay */}
                                                                            <button
                                                                                onClick={prevSlide}
                                                                                disabled={currentSlideIndex === 0}
                                                                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white disabled:opacity-0 transition-all backdrop-blur-sm"
                                                                            >
                                                                                <ChevronDown className="w-6 h-6 rotate-90" />
                                                                            </button>
                                                                            <button
                                                                                onClick={nextSlide}
                                                                                disabled={currentSlideIndex === activeLesson.slides.length - 1}
                                                                                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white disabled:opacity-0 transition-all backdrop-blur-sm"
                                                                            >
                                                                                <ChevronDown className="w-6 h-6 -rotate-90" />
                                                                            </button>

                                                                            <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs text-white backdrop-blur-md border border-white/10">
                                                                                Slide {currentSlideIndex + 1} / {activeLesson.slides.length}
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-4 bg-white/5 border-t border-white/5 flex gap-2 overflow-x-auto">
                                                                            {activeLesson.slides.map((_: any, idx: number) => (
                                                                                <button
                                                                                    key={idx}
                                                                                    onClick={() => setCurrentSlideIndex(idx)}
                                                                                    className={`h-1.5 rounded-full transition-all ${currentSlideIndex === idx ? 'w-8 bg-lumina-primary' : 'w-2 bg-white/20 hover:bg-white/40'
                                                                                        }`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Text Content Viewer */}
                                                                {activeLesson.type === 'text' && (
                                                                    <div className="prose prose-invert max-w-none">
                                                                        {(() => {
                                                                            try {
                                                                                const parsed = JSON.parse(activeLesson.content);
                                                                                if (parsed && Array.isArray(parsed.content)) {
                                                                                    return (
                                                                                        <div className="space-y-8 animate-in fade-in duration-500">
                                                                                            {parsed.pageRef && (
                                                                                                <div className="mb-4 flex justify-end">
                                                                                                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded border border-white/10">
                                                                                                        Source: Page {parsed.pageRef}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}

                                                                                            {parsed.goal && (
                                                                                                <div className="bg-lumina-primary/10 border-l-4 border-lumina-primary p-4 rounded-r-xl">
                                                                                                    <h4 className="text-lumina-primary font-bold text-sm uppercase tracking-wider mb-1">Learning Goal</h4>
                                                                                                    <p className="text-white font-medium">{parsed.goal}</p>
                                                                                                </div>
                                                                                            )}

                                                                                            <div className="space-y-6">
                                                                                                {parsed.content.map((block: any, idx: number) => (
                                                                                                    <div key={idx}>
                                                                                                        {block.type === 'paragraph' && (
                                                                                                            <p className="text-gray-300 leading-relaxed text-lg">{block.content}</p>
                                                                                                        )}
                                                                                                        {block.type === 'list' && (
                                                                                                            <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                                                                                                <ul className="space-y-2">
                                                                                                                    {block.content.split('\n').map((item: string, i: number) => (
                                                                                                                        <li key={i} className="flex gap-3 text-gray-300">
                                                                                                                            <span className="text-lumina-primary mt-1.5">•</span>
                                                                                                                            <span>{item.replace(/^- /, '').replace(/^\* /, '')}</span>
                                                                                                                        </li>
                                                                                                                    ))}
                                                                                                                </ul>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {block.type === 'code' && (
                                                                                                            <div className="relative group">
                                                                                                                <div className="absolute -inset-1 bg-gradient-to-r from-lumina-primary/20 to-purple-600/20 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                                                                                                                <pre className="relative bg-black border border-white/10 p-6 rounded-xl overflow-x-auto">
                                                                                                                    <code className="text-blue-300 font-mono text-sm">{block.content}</code>
                                                                                                                </pre>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {block.type === 'warning' && (
                                                                                                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-200">
                                                                                                                <div className="mt-1">⚠️</div>
                                                                                                                <p>{block.content}</p>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {block.type === 'tip' && (
                                                                                                            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex gap-3 text-emerald-200">
                                                                                                                <div className="mt-1">💡</div>
                                                                                                                <p>{block.content}</p>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                ))}
                                                                                            </div>

                                                                                            {parsed.subtopics && parsed.subtopics.length > 0 && (
                                                                                                <div className="pt-8 mt-12 border-t border-white/10">
                                                                                                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                                                                                        <BookOpen className="text-lumina-primary" />
                                                                                                        Deep Dive
                                                                                                    </h3>
                                                                                                    <div className="grid gap-6">
                                                                                                        {parsed.subtopics.map((sub: any, sIdx: number) => (
                                                                                                            <div key={sIdx} className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-2xl p-6 transition-all">
                                                                                                                <h4 className="text-xl font-bold text-white mb-4">{sub.title}</h4>
                                                                                                                <div className="space-y-4">
                                                                                                                    {sub.content.map((b: any, bIdx: number) => (
                                                                                                                        <div key={bIdx}>
                                                                                                                            {b.type === 'code' ? (
                                                                                                                                <pre className="bg-black/50 p-3 rounded-lg text-xs text-gray-400 font-mono border border-white/5">
                                                                                                                                    {b.content}
                                                                                                                                </pre>
                                                                                                                            ) : (
                                                                                                                                <p className="text-gray-400 text-sm leading-relaxed">{b.content}</p>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                    ))}
                                                                                                                </div>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                            } catch (e) {
                                                                                // Not JSON
                                                                            }
                                                                            // Fallback
                                                                            return activeLesson.content ? (
                                                                                <div className="prose prose-invert max-w-none">
                                                                                    {activeLesson.content.split('\n').map((line: string, i: number) => {
                                                                                        if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold text-white mb-4 mt-6">{line.replace('# ', '')}</h1>;
                                                                                        if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold text-white mb-3 mt-5">{line.replace('## ', '')}</h2>;
                                                                                        if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-bold text-white mb-2 mt-4">{line.replace('### ', '')}</h3>;
                                                                                        if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-300 list-disc">{line.replace('- ', '')}</li>;
                                                                                        if (line.startsWith('```')) return <div key={i} className="bg-black/50 p-4 rounded-lg my-4 text-sm font-mono text-green-400 border border-white/10 overflow-x-auto">Code Block (See render)</div>;
                                                                                        if (line.trim() === '') return <br key={i} />;
                                                                                        return <p key={i} className="text-gray-300 leading-relaxed mb-2">{line}</p>;
                                                                                    })}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-gray-400 italic">No text content available for this lesson.</p>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {(!module.lessons || module.lessons.length === 0) && (
                                                    <div className="p-4 text-center text-gray-500 text-sm italic">
                                                        No lessons content available.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-400 italic">No modules available yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6 sticky top-24">
                        <div className="text-3xl font-bold text-white mb-2">Free</div>
                        <p className="text-gray-400 text-sm mb-6">Full lifetime access</p>

                        <button
                            onClick={() => {
                                if (course.modules?.[0]?.lessons?.[0]) {
                                    handleLessonSelect(course.modules[0].lessons[0], 0, 0);
                                    setExpandedModule(0);
                                }
                            }}
                            className="w-full py-4 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-colors shadow-lg shadow-lumina-primary/20 mb-4 flex items-center justify-center gap-2"
                        >
                            <PlayCircle className="w-5 h-5" />
                            Start Learning Now
                        </button>

                        <div className="space-y-4 pt-6 border-t border-white/10">
                            <h4 className="font-medium text-white">This course includes:</h4>
                            <ul className="space-y-3 text-sm text-gray-400">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Interactive Quizzes</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Module Certificates</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Mobile and TV access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span>Full Lifetime Access</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
