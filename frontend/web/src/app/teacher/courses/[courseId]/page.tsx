'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
    Users,
    BookOpen,
    Settings,
    Plus,
    Search,
    MoreVertical,
    ArrowLeft,
    Loader2,
    Video,
    FileText,
    Trash2,
    ChevronDown,
    ChevronRight,
    PlayCircle
} from 'lucide-react';
import Link from 'next/link';


export default function CourseManagementPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Invite State
    const [email, setEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Module State
    const [isAddingModule, setIsAddingModule] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [expandingModuleId, setExpandingModuleId] = useState<string | null>(null);

    // Lesson State
    const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState('');

    const loadData = async () => {
        setIsLoading(true);
        const courseData = await api.getCourseDetails(courseId);
        setCourse(courseData);
        setIsLoading(false);
    };

    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setIsInviting(true);
        setInviteMessage(null);

        try {
            const res = await api.inviteStudent(email, courseId);
            if (res.success) {
                setInviteMessage({ type: 'success', text: res.message });
                setEmail('');
            } else {
                setInviteMessage({ type: 'error', text: res.error || 'Failed to add student.' });
            }
        } catch (error) {
            console.error(error);
            setInviteMessage({ type: 'error', text: 'An unexpected error occurred.' });
        } finally {
            setIsInviting(false);
        }
    };

    const handleAddModule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newModuleTitle) return;

        try {
            const res = await api.addModule(courseId, newModuleTitle);
            if (res.success) {
                setNewModuleTitle('');
                setIsAddingModule(false);
                // Reload course data to show new module
                const updatedCourse = await api.getCourseDetails(courseId);
                setCourse(updatedCourse);
            } else {
                alert(res.error || 'Failed to add module');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddLesson = async (moduleId: string) => {
        if (!newLessonTitle) return;

        try {
            const res = await api.addLesson(courseId, moduleId, newLessonTitle);
            if (res.success) {
                setNewLessonTitle('');
                setAddingLessonToModuleId(null);
                // Reload
                const updatedCourse = await api.getCourseDetails(courseId);
                setCourse(updatedCourse);
            } else {
                alert(res.error || 'Failed to add lesson');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteModule = async (moduleId: string) => {
        if (!confirm("Are you sure? This will delete all lessons in this module.")) return;

        const res = await api.deleteModule(courseId, moduleId);
        if (res.success) {
            const updated = await api.getCourseDetails(courseId);
            setCourse(updated);
        }
    };

    const handleDeleteLesson = async (moduleId: string, lessonId: string) => {
        if (!confirm("Delete this lesson?")) return;

        const res = await api.deleteLesson(courseId, moduleId, lessonId);
        if (res.success) {
            const updated = await api.getCourseDetails(courseId);
            setCourse(updated);
        }
    };

    const handleUpdateTitle = async () => {
        const newTitle = prompt("Enter new course name:", course.name);
        if (newTitle && newTitle !== course.name) {
            await api.updateCourseDetails(courseId, { name: newTitle });
            setCourse({ ...course, name: newTitle });
        }
    };

    const toggleModule = (moduleId: string) => {
        if (expandingModuleId === moduleId) {
            setExpandingModuleId(null);
        } else {
            setExpandingModuleId(moduleId);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center p-20 text-white">Loading...</div>;
    }

    if (!course) {
        return <div className="text-white text-center p-20">Course not found.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2 group cursor-pointer" onClick={handleUpdateTitle}>
                        {course.name}
                        <Settings className="w-4 h-4 opacity-0 group-hover:opacity-100 text-gray-400" />
                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400 border border-green-500/20">Active</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Manage course content and students</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area (Modules) */}
                <div className="lg:col-span-2 space-y-6">

                    <div className="glass-card p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-purple-400" />
                                Course Curriculum
                            </h2>
                            <button
                                onClick={() => setIsAddingModule(true)}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add Module
                            </button>
                        </div>

                        {/* Add Module Form */}
                        {isAddingModule && (
                            <form onSubmit={handleAddModule} className="mb-6 bg-white/5 p-4 rounded-xl border border-amber-500/30">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        placeholder="Module Title (e.g., Introduction to Cloud)"
                                        value={newModuleTitle}
                                        onChange={(e) => setNewModuleTitle(e.target.value)}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-amber-500 text-black font-bold rounded-lg"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingModule(false)}
                                        className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Module List */}
                        <div className="space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map((module: any, index: number) => (
                                    <div key={module.id || index} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
                                        {/* Module Header */}
                                        <div
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                            onClick={() => toggleModule(module.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-1 rounded bg-white/10 text-gray-400">
                                                    {expandingModuleId === module.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                </div>
                                                <h3 className="font-semibold text-white">{module.title}</h3>
                                                <span className="text-xs text-gray-500">({module.lessons?.length || 0} lessons)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                                                    onClick={(e) => { e.stopPropagation(); setAddingLessonToModuleId(module.id); setExpandingModuleId(module.id); }}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-red-500/10 rounded text-gray-400 hover:text-red-400"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteModule(module.id); }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Lessons List (Expanded) */}
                                        {expandingModuleId === module.id && (
                                            <div className="border-t border-white/10 bg-black/20 p-4 space-y-3">
                                                {module.lessons && module.lessons.map((lesson: any, lIndex: number) => (
                                                    <div key={lesson.id || lIndex} className="flex items-center justify-between p-2 rounded hover:bg-white/5 group">
                                                        <div className="flex items-center gap-3">
                                                            <PlayCircle className="w-4 h-4 text-blue-400" />
                                                            <span className="text-sm text-gray-300">{lesson.title}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-xs text-gray-500">{lesson.duration || '10 min'}</span>
                                                            <button
                                                                className="text-red-400 hover:text-red-300"
                                                                onClick={() => handleDeleteLesson(module.id, lesson.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Lesson Form */}
                                                {addingLessonToModuleId === module.id ? (
                                                    <div className="flex gap-2 mt-2 pl-7">
                                                        <input
                                                            type="text"
                                                            placeholder="Lesson Title"
                                                            value={newLessonTitle}
                                                            onChange={(e) => setNewLessonTitle(e.target.value)}
                                                            className="flex-1 bg-black/20 border border-white/10 rounded px-3 py-1 text-sm text-white focus:ring-1 focus:ring-amber-500 outline-none"
                                                            autoFocus
                                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddLesson(module.id); }}
                                                        />
                                                        <button
                                                            onClick={() => handleAddLesson(module.id)}
                                                            className="px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-bold rounded hover:bg-amber-500/30"
                                                        >
                                                            Add
                                                        </button>
                                                        <button
                                                            onClick={() => setAddingLessonToModuleId(null)}
                                                            className="px-2 py-1 hover:bg-white/10 text-gray-400 rounded"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setAddingLessonToModuleId(module.id)}
                                                        className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 ml-7 mt-2"
                                                    >
                                                        <Plus size={14} /> Add Lesson
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 border-2 border-dashed border-white/10 rounded-xl">
                                    <p className="text-gray-400">No modules yet. Start building your curriculum!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invite Student Card */}
                    <div className="glass-card p-6 border border-amber-500/20">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-amber-500" />
                            Add Student
                        </h2>

                        <form onSubmit={handleInvite} className="flex gap-4">
                            <input
                                type="email"
                                placeholder="Enter student email (e.g. student@test.com)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-amber-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={isInviting || !email}
                                className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isInviting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
                            </button>
                        </form>

                        {inviteMessage && (
                            <div className={`mt-4 p-3 rounded-lg text-sm ${inviteMessage.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                {inviteMessage.text}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-medium text-gray-400 uppercase mb-4">Course Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-white flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-400" />
                                    Enrolled Students
                                </span>
                                <span className="font-bold text-white">{course.students}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-purple-400" />
                                    Modules
                                </span>
                                <span className="font-bold text-white">{course.modules?.length || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
