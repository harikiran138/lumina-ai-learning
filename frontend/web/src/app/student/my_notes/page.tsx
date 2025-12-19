'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, FileText, Folder, X, Upload, Trash2, Calendar, Eye, Grid, List, ChevronLeft, Save, Paperclip, Clock, PenTool } from 'lucide-react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import HandwritingUpload from '@/components/HandwritingUpload';

export default function MyNotesPage() {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // View State
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'editor'>('grid');
    const [listView, setListView] = useState<'grid' | 'list'>('grid'); // Tracks the preference for the list view itself

    // Editor State
    const [activeNote, setActiveNote] = useState<any>(null); // Null means creating new
    const [formData, setFormData] = useState({
        title: '',
        subject: 'General',
        content: '',
        attachments: [] as any[]
    });

    // Preview File State (for viewing attachments)
    const [previewFile, setPreviewFile] = useState<any>(null);

    // Handwriting Upload Modal State
    const [showHandwritingModal, setShowHandwritingModal] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchNotes();
    }, []);

    const fetchNotes = async () => {
        try {
            const data = await api.getNotes();
            setNotes(data || []);
        } catch (error) {
            console.error("Failed to fetch notes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setActiveNote(null);
        setFormData({
            title: '',
            subject: selectedSubject === 'All' ? 'General' : selectedSubject,
            content: '',
            attachments: []
        });
        setViewMode('editor');
    };

    const handleOpenNote = (note: any) => {
        setActiveNote(note);
        setFormData({
            title: note.title,
            subject: note.subject,
            content: note.content,
            attachments: note.attachments || []
        });
        setViewMode('editor');
    };

    const [isSaving, setIsSaving] = useState(false);

    // Debounced Autosave
    useEffect(() => {
        const saveTimer = setTimeout(async () => {
            if (activeNote && formData.title) {
                // Only autosave if we already have an active note (it was created)
                // and there are changes. For simplicity we just save if activeNote exists.
                // Comparing logic omitted for brevity, but this ensures persistence.
                handleSilentSave();
            }
        }, 2000);

        return () => clearTimeout(saveTimer);
    }, [formData, activeNote]);

    const handleSilentSave = async () => {
        if (!activeNote || !formData.title.trim()) return;
        setIsSaving(true);
        try {
            await api.updateNote(activeNote.id, formData);
        } catch (e) {
            console.error("Autosave failed", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveNote = async () => {
        if (!formData.title.trim()) {
            alert("Title is required");
            return;
        }
        setIsSaving(true);

        try {
            let noteId = activeNote?.id;

            if (activeNote) {
                await api.updateNote(activeNote.id, formData);
            } else {
                const res = await api.createNote(formData);
                if (res && res.success) {
                    noteId = res.id;
                    // Switch to "Edit Mode" for the new note immediately
                    // We need to construct the note object as if it came from DB
                    setActiveNote({
                        id: noteId,
                        ...formData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            }

            // Don't switch view mode to grid, stay in editor to allow continued writing
            // Just refresh list in background
            fetchNotes();
            // alert("Saved successfully!"); // Optional: Feedback is good, but "Real time" should be subtle.
        } catch (error) {
            console.error("Failed to save note", error);
            alert("Failed to save note. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;
        try {
            await api.deleteNote(noteId);
            if (activeNote?.id === noteId && viewMode === 'editor') {
                setViewMode('grid');
                setActiveNote(null);
            }
            fetchNotes();
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // Increased to 5MB
                alert("File is too large. Max size is 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const newAttachment = {
                    name: file.name,
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    type: file.type,
                    url: reader.result as string
                };
                setFormData(prev => ({
                    ...prev,
                    attachments: [...prev.attachments, newAttachment]
                }));
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleHandwritingUpload = async (data: any) => {
        // Extract digitized text from the upload response
        const digitalText = data.digital_text || '';
        const aiAnalysis = data.ai_analysis || '';

        // Append digitized text to note content
        let newContent = formData.content.trim();

        if (newContent) {
            newContent += '\n\n--- Digitized Handwriting ---\n\n';
        }

        newContent += digitalText;

        // If AI analysis is available, add it as well
        if (aiAnalysis) {
            newContent += '\n\n' + aiAnalysis;
        }

        // Update Form Data
        const updatedAttachments = [...formData.attachments];
        if (data.image_path) {
            // Note: image_path from backend is relative (/uploads/...), we need to ensure it works.
            // If using local backend and Vercel frontend, we need full URL or proxy.
            // But typically this path is for the static mount. 
            // We'll trust the component handled the upload URL, and here we just store the reference
            // provided by the backend response.
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const fullUrl = data.image_path.startsWith('http') ? data.image_path : `${API_URL}${data.image_path}`;

            const newAttachment = {
                name: 'Handwritten Note',
                size: 'N/A',
                type: 'image',
                url: fullUrl
            };
            updatedAttachments.push(newAttachment);
        }

        const newFormData = {
            ...formData,
            content: newContent,
            attachments: updatedAttachments
        };

        setFormData(newFormData);

        // REAL TIME SAVE: Immediately save/update
        setIsSaving(true);
        try {
            if (activeNote) {
                await api.updateNote(activeNote.id, newFormData);
            } else {
                // If this was a new note started via upload, create it now
                // Ensure title exists
                const titleToUse = newFormData.title || "Digitized Note " + new Date().toLocaleString();
                const createData = { ...newFormData, title: titleToUse };
                if (!newFormData.title) setFormData(prev => ({ ...prev, title: titleToUse })); // Update UI title

                const res = await api.createNote(createData);
                if (res && res.success) {
                    setActiveNote({
                        id: res.id,
                        ...createData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            }
            fetchNotes();
        } catch (e) {
            console.error("Failed to auto-save digitized note", e);
        } finally {
            setIsSaving(false);
        }

        // Close modal
        setShowHandwritingModal(false);
    };

    // Derived State
    const subjects = ['All', ...Array.from(new Set(notes.map(n => n.subject)))];

    const filteredNotes = notes.filter(note => {
        const matchesSubject = selectedSubject === 'All' || note.subject === selectedSubject;
        const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            note.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    return (
        <div className="flex h-[calc(100vh-2rem)] gap-6 lg:flex-row flex-col">

            {/* Sidebar (Desktop) */}
            <div className={`
                hidden lg:flex flex-col w-64 glass-card p-4 flex-shrink-0 h-full transition-all duration-300
                ${viewMode === 'editor' ? 'w-16 items-center' : 'w-64'}
            `}>
                {viewMode === 'editor' ? (
                    // Collapsed Sidebar when editing
                    <div className="flex flex-col items-center gap-6 pt-2">
                        <button onClick={() => setViewMode('grid')} suppressHydrationWarning className="p-2 bg-white/10 rounded-xl hover:bg-white/20 text-white transition-colors" title="Back to Library">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="w-8 h-[1px] bg-white/10"></div>
                        <button onClick={handleCreateNew} suppressHydrationWarning className="p-2 bg-lumina-primary text-black rounded-xl hover:scale-110 transition-transform" title="New Note">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    // Expanded Sidebar
                    <>
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Library</h2>
                            <Folder className="w-5 h-5 text-lumina-primary" />
                        </div>

                        <div className="relative mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                suppressHydrationWarning
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-lumina-primary/50 transition-colors"
                            />
                        </div>

                        <button
                            onClick={handleCreateNew}
                            suppressHydrationWarning
                            className="w-full mt-4 py-3 bg-gradient-to-r from-lumina-primary to-amber-600 text-black font-bold rounded-xl shadow-lg shadow-lumina-primary/20 hover:shadow-lumina-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            <span>New Note</span>
                        </button>

                        <div className="mt-4 space-y-1 overflow-y-auto flex-1 custom-scrollbar pr-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Folders</p>
                            {subjects.map(subject => (
                                <button
                                    key={subject}
                                    onClick={() => setSelectedSubject(subject)}
                                    suppressHydrationWarning
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all group ${selectedSubject === subject
                                        ? 'bg-lumina-primary/10 text-lumina-primary border border-lumina-primary/10'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
                                        }`}
                                >
                                    <span className="truncate text-sm font-medium">{subject}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${selectedSubject === subject ? 'bg-lumina-primary/20 text-lumina-primary' : 'bg-white/5 group-hover:bg-white/10'
                                        }`}>
                                        {subject === 'All' ? notes.length : notes.filter(n => n.subject === subject).length}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Mobile Sidebar / Header */}
            {viewMode !== 'editor' && (
                <div className="lg:hidden px-4 md:px-0 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    <button onClick={handleCreateNew} suppressHydrationWarning className="p-2 bg-lumina-primary rounded-full text-black flex-shrink-0">
                        <Plus className="w-5 h-5" />
                    </button>
                    {subjects.map(subject => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            suppressHydrationWarning
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedSubject === subject
                                ? 'bg-lumina-primary text-black'
                                : 'bg-white/5 text-gray-400 border border-white/10'
                                }`}
                        >
                            {subject}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col glass-card h-full overflow-hidden relative">

                {viewMode === 'editor' ? (
                    // INLINE EDITOR VIEW
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col h-full bg-[#0a0a0a]"
                    >
                        {/* Editor Header */}
                        <div className="flex-shrink-0 p-4 md:p-6 border-b border-white/5 flex flex-col gap-4 bg-black/20">
                            <div className="flex items-center justify-between">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    suppressHydrationWarning
                                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Back to Library
                                </button>
                                <div className="flex items-center gap-3">
                                    {activeNote && (
                                        <button
                                            onClick={() => handleDeleteNote(activeNote.id)}
                                            suppressHydrationWarning
                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                            title="Delete Note"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSaveNote}
                                        suppressHydrationWarning
                                        className="flex items-center gap-2 px-5 py-2 bg-lumina-primary text-black font-bold rounded-lg hover:shadow-lg hover:shadow-lumina-primary/20 transition-all hover:bg-lumina-primary/90"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Note
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <Folder className="w-4 h-4 text-gray-500" />
                                    <input
                                        type="text"
                                        suppressHydrationWarning
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="bg-transparent text-sm font-mono text-lumina-primary uppercase tracking-wider outline-none placeholder:text-gray-700 w-full"
                                        placeholder="FOLDER / SUBJECT"
                                    />
                                </div>
                                <input
                                    type="text"
                                    suppressHydrationWarning
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="text-3xl md:text-5xl font-bold bg-transparent border-none outline-none text-white placeholder:text-gray-700 w-full"
                                    placeholder="Untitled Note"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                            <div className={`flex-1 flex flex-col h-full relative ${previewFile ? 'hidden md:flex md:w-1/2 border-r border-white/5' : 'w-full'}`}>
                                <textarea
                                    suppressHydrationWarning
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="flex-1 w-full bg-transparent p-6 md:p-10 text-lg text-gray-300 outline-none resize-none leading-relaxed custom-scrollbar placeholder:text-gray-800 font-light"
                                    placeholder="Start writing your thoughts here..."
                                />

                                {/* Attachments Bar */}
                                <div className="p-4 border-t border-white/5 flex items-center gap-4 bg-black/40 backdrop-blur-sm">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        suppressHydrationWarning
                                        className="flex items-center gap-2 text-lumina-primary hover:text-white transition-colors text-sm font-bold bg-lumina-primary/10 hover:bg-white/10 px-3 py-1.5 rounded-lg"
                                    >
                                        <Paperclip className="w-4 h-4" />
                                        Attach File
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileUpload}
                                    />
                                    <button
                                        onClick={() => setShowHandwritingModal(true)}
                                        suppressHydrationWarning
                                        className="flex items-center gap-2 text-green-400 hover:text-white transition-colors text-sm font-bold bg-green-500/10 hover:bg-white/10 px-3 py-1.5 rounded-lg"
                                    >
                                        <PenTool className="w-4 h-4" />
                                        Upload Handwriting
                                    </button>


                                    <div className="flex-1 flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                                        {formData.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg pl-3 pr-2 py-1.5 text-xs text-gray-300 flex-shrink-0">
                                                <span
                                                    onClick={() => setPreviewFile(file)}
                                                    className="truncate max-w-[120px] cursor-pointer hover:text-lumina-primary hover:underline"
                                                >
                                                    {file.name}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newAtt = [...formData.attachments];
                                                        newAtt.splice(idx, 1);
                                                        setFormData({ ...formData, attachments: newAtt });
                                                        if (previewFile === file) setPreviewFile(null);
                                                    }}
                                                    suppressHydrationWarning
                                                    className="text-gray-500 hover:text-red-400"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono">
                                        {formData.content.length} chars
                                    </div>
                                </div>
                            </div>

                            {/* Preview Pane */}
                            <AnimatePresence>
                                {previewFile && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="flex-1 bg-black/60 flex flex-col h-full backdrop-blur-sm absolute inset-0 md:relative z-20"
                                    >
                                        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-white/5">
                                            <span className="text-sm font-bold text-gray-200 truncate">{previewFile.name}</span>
                                            <button onClick={() => setPreviewFile(null)} suppressHydrationWarning className="text-gray-400 hover:text-white">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="flex-1 p-6 flex items-center justify-center overflow-auto bg-checkered-pattern">
                                            {previewFile.type.startsWith('image/') ? (
                                                <img src={previewFile.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                                            ) : previewFile.type === 'application/pdf' ? (
                                                <iframe src={previewFile.url} className="w-full h-full rounded-lg shadow-2xl" title="PDF Preview"></iframe>
                                            ) : (
                                                <div className="text-center text-gray-500">
                                                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                    <p>Preview not available</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    // GRID / LIST VIEW (Library)
                    <>
                        <div className="hidden md:flex p-6 border-b border-white/5 items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">{selectedSubject === 'All' ? 'All Notes' : selectedSubject}</h1>
                                <p className="text-sm text-gray-500">{filteredNotes.length} notes found</p>
                            </div>
                            <div className="flex gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setListView('grid')}
                                    suppressHydrationWarning
                                    className={`p-2 rounded-md transition-all ${listView === 'grid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <Grid className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setListView('list')}
                                    suppressHydrationWarning
                                    className={`p-2 rounded-md transition-all ${listView === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-4">
                                    <div className="w-12 h-12 border-4 border-lumina-primary/30 border-t-lumina-primary rounded-full animate-spin"></div>
                                    <p className="text-gray-500 animate-pulse">Loading library...</p>
                                </div>
                            ) : filteredNotes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                        <FileText className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No notes here yet</h3>
                                    <p className="text-gray-500 max-w-xs mb-6">Create your first note to start building your personal knowledge base.</p>
                                    <button
                                        onClick={handleCreateNew}
                                        suppressHydrationWarning
                                        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 transition-all font-medium"
                                    >
                                        Create Note
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    layout
                                    className={`grid gap-4 ${listView === 'grid' ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}
                                >
                                    <AnimatePresence>
                                        {filteredNotes.map(note => (
                                            <motion.div
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                key={note.id}
                                                onClick={() => handleOpenNote(note)}
                                                className="group cursor-pointer bg-black/20 hover:bg-white/5 border border-white/5 hover:border-lumina-primary/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-black/50 overflow-hidden relative"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-lumina-primary/10 to-transparent rounded-bl-full -mr-12 -mt-12 group-hover:from-lumina-primary/20 transition-all"></div>

                                                <div className="relative z-10">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="text-[10px] font-bold tracking-wider uppercase text-lumina-primary bg-lumina-primary/10 px-2 py-1 rounded-md border border-lumina-primary/10">
                                                            {note.subject}
                                                        </span>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {new Date(note.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-lumina-primary transition-colors">{note.title}</h3>
                                                    <p className="text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">{note.content}</p>

                                                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                                        {note.attachments?.length > 0 ? (
                                                            <div className="flex items-center text-xs text-gray-400 group-hover:text-gray-300">
                                                                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center mr-2 border border-white/5">
                                                                    <Upload className="w-3 h-3" />
                                                                </div>
                                                                {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
                                                            </div>
                                                        ) : (
                                                            <div className="text-xs text-gray-600 italic">No attachments</div>
                                                        )}

                                                        <div className="w-8 h-8 rounded-full bg-transparent group-hover:bg-white/10 flex items-center justify-center text-gray-500 group-hover:text-white transition-all">
                                                            <Eye className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Handwriting Upload Modal */}
            <AnimatePresence>
                {showHandwritingModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowHandwritingModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <PenTool className="w-6 h-6 text-green-400" />
                                    Digitize Handwritten Notes
                                </h2>
                                <button
                                    onClick={() => setShowHandwritingModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400 hover:text-white" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-6">
                                Upload a photo or PDF of your handwritten notes. We'll extract the text using AI and add it to your note automatically.
                            </p>
                            <HandwritingUpload
                                type="note"
                                onUploadComplete={handleHandwritingUpload}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
