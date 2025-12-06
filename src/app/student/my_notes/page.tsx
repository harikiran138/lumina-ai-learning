'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Search, FileText, Folder, X, Upload, Download, Trash2, Calendar, Eye } from 'lucide-react';
import { api } from '@/lib/api';

export default function MyNotesPage() {
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<any>(null);
    const [previewFile, setPreviewFile] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        subject: 'General',
        content: '',
        attachments: [] as any[]
    });

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

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.createNote(formData);
            setIsAddModalOpen(false);
            setFormData({ title: '', subject: 'General', content: '', attachments: [] });
            fetchNotes(); // Refresh list
        } catch (error) {
            console.error("Failed to create note", error);
        }
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!confirm("Are you sure you want to delete this note?")) return;
        try {
            await api.deleteNote(noteId);
            if (selectedNote?.id === noteId) {
                setSelectedNote(null);
                setPreviewFile(null);
            }
            fetchNotes();
        } catch (error) {
            console.error("Failed to delete note", error);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Limit to 2MB for Base64 storage performance
            if (file.size > 2 * 1024 * 1024) {
                alert("File is too large. Max size is 2MB.");
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
        <div className="flex h-[calc(100vh-2rem)] gap-6 p-6">
            {/* Sidebar - Subjects */}
            <div className="w-64 flex-shrink-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Folders</h2>
                    <Folder className="w-5 h-5 text-lumina-primary" />
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                    {subjects.map(subject => (
                        <button
                            key={subject}
                            onClick={() => setSelectedSubject(subject)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${selectedSubject === subject
                                    ? 'bg-lumina-primary/20 text-lumina-primary border border-lumina-primary/10'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="truncate">{subject}</span>
                            <span className="text-xs opacity-50 bg-white/10 px-2 py-0.5 rounded-full">
                                {subject === 'All' ? notes.length : notes.filter(n => n.subject === subject).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lumina-primary/50 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 bg-lumina-primary hover:bg-lumina-primary/90 text-black font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        <span>New Note</span>
                    </button>
                </div>

                {/* Notes Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lumina-primary"></div>
                        </div>
                    ) : filteredNotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p>No notes found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredNotes.map(note => (
                                <div
                                    key={note.id}
                                    onClick={() => setSelectedNote(note)}
                                    className="group cursor-pointer bg-black/20 hover:bg-black/40 border border-white/5 hover:border-lumina-primary/30 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-xs font-medium text-lumina-primary bg-lumina-primary/10 px-2 py-1 rounded-md">
                                            {note.subject}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(note.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-white mb-2 line-clamp-1 group-hover:text-lumina-primary transition-colors">{note.title}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">{note.content}</p>

                                    {note.attachments?.length > 0 && (
                                        <div className="mt-auto pt-3 border-t border-white/5 flex items-center text-xs text-gray-500">
                                            <Upload className="w-3 h-3 mr-1" />
                                            {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Add Note Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Create New Note</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateNote} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-lumina-primary/50 outline-none"
                                        placeholder="Note title..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-lumina-primary/50 outline-none"
                                        placeholder="e.g. Physics, Math..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                                <textarea
                                    required
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full h-40 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-lumina-primary/50 outline-none resize-none custom-scrollbar"
                                    placeholder="Write your note here..."
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-medium text-gray-400">Attachments</label>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-xs text-lumina-primary hover:underline flex items-center"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> Add File
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.png,.jpg,.jpeg,.txt"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                {formData.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center bg-white/5 border border-white/10 rounded-md px-2 py-1 text-xs text-gray-300">
                                                <span>{file.name}</span>
                                                <span className="mx-1 text-gray-600">|</span>
                                                <span className="text-gray-500">{file.size}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-lumina-primary text-black font-semibold hover:bg-lumina-primary/90 transition-colors"
                                >
                                    Save Note
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Note Modal */}
            {selectedNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#1a1a1a] z-10 w-full">
                            <div>
                                <span className="text-xs font-medium text-lumina-primary bg-lumina-primary/10 px-2 py-1 rounded-md mb-2 inline-block">
                                    {selectedNote.subject}
                                </span>
                                <h3 className="text-2xl font-bold text-white mt-1">{selectedNote.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {new Date(selectedNote.createdAt).toLocaleString()}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleDeleteNote(selectedNote.id)}
                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Delete Note"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => { setSelectedNote(null); setPreviewFile(null); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                            {/* Note Content */}
                            <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar ${previewFile ? 'hidden md:block md:w-1/2 border-r border-white/10' : 'w-full'}`}>
                                <div className="prose prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-gray-300 leading-relaxed text-lg">
                                        {selectedNote.content}
                                    </p>
                                </div>
                            </div>

                            {/* File Preview Panel */}
                            {previewFile && (
                                <div className="flex-1 bg-black/40 flex flex-col h-full border-t md:border-t-0 md:border-l border-white/10">
                                    <div className="p-2 border-b border-white/10 flex justify-between items-center bg-white/5">
                                        <span className="text-xs font-medium text-gray-400 truncate max-w-[200px]">{previewFile.name}</span>
                                        <button onClick={() => setPreviewFile(null)} className="text-xs text-gray-500 hover:text-white">Close Review</button>
                                    </div>
                                    <div className="flex-1 p-4 flex items-center justify-center overflow-hidden relative">
                                        {previewFile.type.startsWith('image/') ? (
                                            <img src={previewFile.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                                        ) : previewFile.type === 'application/pdf' ? (
                                            <iframe src={previewFile.url} className="w-full h-full rounded-lg border border-white/10" title="PDF Preview"></iframe>
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                <p>Preview not available for this file type.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedNote.attachments?.length > 0 && !previewFile && (
                            <div className="p-6 border-t border-white/10 bg-black/20">
                                <h4 className="text-sm font-medium text-gray-400 mb-3">Attachments & Resources</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    {selectedNote.attachments.map((file: any, idx: number) => (
                                        <div
                                            key={idx}
                                            onClick={() => setPreviewFile(file)}
                                            className="group flex items-center p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-lumina-primary/30 transition-all cursor-pointer"
                                        >
                                            <div className="w-10 h-10 bg-black/40 rounded-lg flex items-center justify-center mr-3 text-lumina-primary group-hover:scale-110 transition-transform">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-white truncate group-hover:text-lumina-primary transition-colors">{file.name}</p>
                                                <p className="text-xs text-gray-500">{file.size}</p>
                                            </div>
                                            <div className="p-2 text-gray-400 group-hover:text-white">
                                                {file.type === 'application/pdf' ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
