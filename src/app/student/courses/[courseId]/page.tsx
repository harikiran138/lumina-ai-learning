'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BookOpen, Clock, Users, Star, PlayCircle, CheckCircle, ChevronDown, ChevronUp, HelpCircle, X, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CourseDetails() {
    const params = useParams();
    const courseId = params.courseId as string;
    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedModule, setExpandedModule] = useState<number | null>(0);
    const [activeQuiz, setActiveQuiz] = useState<any>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);

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

    const handleLessonSelect = (lesson: any) => {
        if (lesson.type === 'quiz') {
            setActiveQuiz(lesson);
            setQuizAnswers({});
            setQuizSubmitted(false);
            setQuizScore(0);
        } else {
            // For video lessons, we could open a video player or mark as complete
            alert(`Playing video: ${lesson.title}`);
        }
    };

    const handleQuizOptionSelect = (questionId: string, optionIndex: number) => {
        if (quizSubmitted) return;
        setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const submitQuiz = () => {
        if (!activeQuiz) return;
        let score = 0;
        activeQuiz.questions.forEach((q: any) => {
            if (quizAnswers[q.id] === q.correctAnswer) {
                score++;
            }
        });
        setQuizScore(score);
        setQuizSubmitted(true);
    };

    const closeQuiz = () => {
        setActiveQuiz(null);
        setQuizAnswers({});
        setQuizSubmitted(false);
    };

    if (isLoading) return <div className="text-white text-center p-20">Loading course details...</div>;
    if (!course) return <div className="text-white text-center p-20">Course not found.</div>;

    return (
        <div className="space-y-8 relative">
            {/* Quiz Modal */}
            {activeQuiz && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-gray-900 z-10">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <HelpCircle className="text-amber-500" />
                                {activeQuiz.title}
                            </h3>
                            <button onClick={closeQuiz} className="text-gray-400 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {!quizSubmitted ? (
                                activeQuiz.questions.map((q: any, idx: number) => (
                                    <div key={q.id} className="space-y-4">
                                        <h4 className="text-lg font-medium text-white">
                                            <span className="text-amber-500 mr-2">{idx + 1}.</span>
                                            {q.question}
                                        </h4>
                                        <div className="space-y-2 pl-6">
                                            {q.options.map((option: string, optIdx: number) => (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleQuizOptionSelect(q.id, optIdx)}
                                                    className={`w-full text-left p-3 rounded-lg border transition-all ${quizAnswers[q.id] === optIdx
                                                            ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                                                            : 'border-white/10 hover:border-white/30 text-gray-300'
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 animate-bounce" />
                                    <h4 className="text-3xl font-bold text-white mb-2">Quiz Completed!</h4>
                                    <p className="text-xl text-gray-300">
                                        You scored <span className="text-amber-500 font-bold">{quizScore}</span> out of {activeQuiz.questions.length}
                                    </p>
                                    <div className="mt-8">
                                        <p className="text-sm text-gray-500">XP Earned: {quizScore * 50}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-white/10 mt-auto sticky bottom-0 bg-gray-900 z-10">
                            {!quizSubmitted ? (
                                <button
                                    onClick={submitQuiz}
                                    disabled={Object.keys(quizAnswers).length !== activeQuiz.questions.length}
                                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-amber-500/20 transition-all"
                                >
                                    Submit Answers
                                </button>
                            ) : (
                                <button
                                    onClick={closeQuiz}
                                    className="w-full py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all"
                                >
                                    Close Quiz
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
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass-card p-8">
                        <h2 className="text-2xl font-bold text-white mb-4">About This Course</h2>
                        <p className="text-gray-300 leading-relaxed">
                            {course.expandedDescription}
                        </p>
                    </div>

                    <div className="glass-card p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">Course Content</h2>
                            <span className="text-sm text-gray-400">{course.modules?.length || 0} Modules</span>
                        </div>

                        <div className="space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map((module: any, i: number) => (
                                    <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
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
                                                        onClick={() => handleLessonSelect(lesson)}
                                                        className="p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer border-b border-white/5 last:border-0 group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            {lesson.type === 'quiz' ? (
                                                                <HelpCircle className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                                                            ) : (
                                                                <PlayCircle className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                                            )}
                                                            <span className="text-gray-300 group-hover:text-white transition-colors">
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
