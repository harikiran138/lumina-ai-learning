'use client';

import { useState, useEffect } from 'react';
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
    LayoutDashboard,
    Award
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { use } from 'react';

export default function CourseDetails({ params }: { params: Promise<{ courseId: string }> }) {
    const { courseId } = use(params);
    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState<number | null>(0);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0); // Added for slides
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);

    const [showBadgeParams, setShowBadgeParams] = useState<any>(null); // For badge notification
    const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

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


    const handleLessonSelect = async (lesson: any, moduleId: string) => {
        setActiveModuleId(moduleId);
        if (lesson.type === 'quiz') {
            setActiveQuiz(lesson);
            setActiveLesson(null);
            setQuizAnswers({});
            setQuizSubmitted(false);
            setQuizScore(0);
            setCurrentQuestionIndex(0); // Reset to first question
        } else {
            // Set active text/video lesson
            setActiveLesson(lesson);
            setActiveQuiz(null);
            setCurrentSlideIndex(0); // Reset slides
            // Scroll to top of content
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }
    };

    const handleCompleteLesson = async () => {
        if (!activeLesson || !activeModuleId) return;

        try {
            const result = await api.completeLesson(courseId, activeModuleId, activeLesson.id);
            if (result.success) {
                // Show success feedback - maybe a small toast
                // If badge earned, show modal
                if (result.badgeEarned) {
                    setShowBadgeParams(result.badgeEarned);
                }
            }
        } catch (error) {
            console.error("Failed to complete lesson", error);
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
        if (!activeQuiz || !activeModuleId) return;
        let score = 0;
        activeQuiz.questions.forEach((q: any) => {
            if (quizAnswers[q.id] === q.correctAnswer) {
                score++;
            }
        });
        setQuizScore(score);
        setQuizSubmitted(true);

        try {
            // If passed (e.g. > 70%), mark complete
            if (score / activeQuiz.questions.length >= 0.7) {
                const result = await api.completeLesson(courseId, activeModuleId, activeQuiz.id);
                if (result.success && result.badgeEarned) {
                    setShowBadgeParams(result.badgeEarned);
                }
            }
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
                <div className="lg:col-span-2 space-y-8">

                    {/* Dynamic Content Viewer */}
                    {activeLesson ? (
                        <div className="glass-card p-8 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                                <h1 className="text-2xl font-bold text-white">{activeLesson.title}</h1>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleCompleteLesson}
                                        className="px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg text-sm font-medium border border-green-600/20 transition-colors flex items-center gap-2"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Mark Complete
                                    </button>
                                    <button onClick={() => setActiveLesson(null)} className="text-sm text-gray-400 hover:text-white underline">
                                        Back to Overview
                                    </button>
                                </div>
                            </div>

                            {/* Badge Modal */}
                            {showBadgeParams && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                                    <div className="glass-card max-w-sm w-full p-8 text-center relative border-amber-500/30">
                                        <button
                                            onClick={() => setShowBadgeParams(null)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>

                                        <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,158,11,0.4)] animate-bounce-custom">
                                            <Award className="w-12 h-12 text-white" />
                                        </div>

                                        <h2 className="text-2xl font-bold text-white mb-2">Badge Unlocked!</h2>
                                        <h3 className="text-xl text-lumina-primary font-bold mb-4">{showBadgeParams.name}</h3>
                                        <p className="text-gray-300 mb-6">{showBadgeParams.description}</p>

                                        <button
                                            onClick={() => setShowBadgeParams(null)}
                                            className="w-full py-3 bg-gradient-to-r from-lumina-primary to-amber-500 text-black font-bold rounded-xl hover:scale-105 transition-transform"
                                        >
                                            Awesome!
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeLesson.type === 'video' && (
                                <div className="aspect-video bg-black rounded-xl flex items-center justify-center border border-white/10 mb-6 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80')] bg-cover bg-center opacity-30 group-hover:opacity-40 transition-opacity"></div>
                                    <PlayCircle className="w-20 h-20 text-white opacity-80 group-hover:scale-110 transition-transform relative z-10" />
                                    <p className="absolute bottom-4 left-4 text-white font-medium z-10">Watching: {activeLesson.title}</p>
                                </div>
                            )}

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
                                            <ChevronDown className="w-6 h-6 rotate-90" /> {/* Using Chevron as arrow */}
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

                            {activeLesson.type === 'text' && (
                                activeLesson.content ? (
                                    <div className="prose prose-invert max-w-none">
                                        {/* Simple Markdown Rendering */}
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
                                )
                            )}
                        </div>
                    ) : (
                        <div className="glass-card p-8">
                            <h2 className="text-2xl font-bold text-white mb-4">About This Course</h2>
                            <p className="text-gray-300 leading-relaxed">
                                {course.expandedDescription}
                            </p>
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
                                                        onClick={() => handleLessonSelect(lesson, module.id)}
                                                        className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group ${activeLesson?.id === lesson.id ? 'bg-lumina-primary/10 border-l-2 border-l-lumina-primary' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {lesson.type === 'quiz' ? (
                                                                <HelpCircle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                                                            ) : lesson.type === 'slides' ? (
                                                                <LayoutDashboard className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                                                            ) : (
                                                                <PlayCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                            )}
                                                            <span className={`transition-colors ${activeLesson?.id === lesson.id ? 'text-lumina-primary font-medium' : 'text-gray-300 group-hover:text-white'}`}>
                                                                {lesson.title}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                                            {lesson.duration}
                                                        </span>
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

                        <button className="w-full py-4 bg-lumina-primary text-black font-bold rounded-xl hover:bg-lumina-secondary transition-colors shadow-lg shadow-lumina-primary/20 mb-4 flex items-center justify-center gap-2">
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
