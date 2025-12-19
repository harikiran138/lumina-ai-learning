"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Calendar, User, Clock, Loader2, Sparkles, X, CheckCircle } from 'lucide-react';

export default function AssignmentSubmissionsPage() {
    const params = useParams();
    const router = useRouter();
    const assignmentId = params.id as string;

    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingId, setGradingId] = useState<string | null>(null);
    const [gradeResult, setGradeResult] = useState<any | null>(null);
    const [editingScore, setEditingScore] = useState<number | string>("");
    const [editingFeedback, setEditingFeedback] = useState<string>("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSubmissions();
    }, [assignmentId]);

    const fetchSubmissions = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/assignments/${assignmentId}/submissions`, { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setSubmissions(data);
            }
        } catch (e) {
            console.error("Failed to fetch submissions", e);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = async (submissionId: string) => {
        setGradingId(submissionId);
        setGradeResult(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/assignments/${assignmentId}/submissions/${submissionId}/grade`, {
                method: 'POST'
            });
            if (res.ok) {
                const data = await res.json();
                setGradeResult(data);
                setEditingScore(data.score);
                setEditingFeedback(data.feedback);
                fetchSubmissions(); // specific refresh
            } else {
                alert("Grading failed. Please try again.");
            }
        } catch (e) {
            console.error(e);
            alert("Error during AI grading");
        } finally {
            setGradingId(null);
        }
    };

    const handleSaveGrade = async () => {
        if (!gradeResult || !gradeResult.submissionId) return; // We need submissionId in gradeResult or separate state

        setSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/assignments/${assignmentId}/submissions/${gradeResult.submissionId}/score`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: Number(editingScore),
                    feedback: editingFeedback
                })
            });

            if (res.ok) {
                alert("Score updated successfully!");
                setGradeResult(null);
                fetchSubmissions();
            } else {
                alert("Failed to update score");
            }
        } catch (e) {
            console.error(e);
            alert("Error updating score");
        } finally {
            setSaving(false);
        }
    };

    const getFileUrl = (filePath: string | null | undefined) => {
        if (!filePath) return "#";
        const filename = filePath.split(/[\\/]/).pop();
        return `${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/uploads/${filename}`;
    };

    return (
        <div className="p-6 md:p-8 space-y-8 relative">
            <div className="flex items-center gap-4">
                <Link
                    href="/teacher/assignments"
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Submissions</h1>
                    <p className="text-gray-400">Assignment ID: <span className="font-mono text-amber-500">{assignmentId}</span></p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
            ) : submissions.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-xl">
                    <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No submissions yet</h3>
                    <p className="text-gray-400">Students haven't submitted any work for this assignment.</p>
                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/10 bg-black/20">
                                    <th className="p-6 text-sm font-semibold text-gray-300">Student</th>
                                    <th className="p-6 text-sm font-semibold text-gray-300">Submitted At</th>
                                    <th className="p-6 text-sm font-semibold text-gray-300">File</th>
                                    <th className="p-6 text-sm font-semibold text-gray-300">Status</th>
                                    <th className="p-6 text-sm font-semibold text-gray-300">Score</th>
                                    <th className="p-6 text-sm font-semibold text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {submissions.map((sub: any) => (
                                    <tr key={sub.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {sub.student_id ? sub.student_id.substring(0, 2).toUpperCase() : 'ST'}
                                                </div>
                                                <span className="font-medium text-white">{sub.student_id}</span>
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Clock className="w-4 h-4 text-gray-500" />
                                                {new Date(sub.timestamp || sub.submitted_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-2 text-gray-300 font-mono text-xs">
                                                <FileText className="w-4 h-4 text-gray-500" />
                                                {sub.file_path ? sub.file_path.split(/[\\/]/).pop() : "No File"}
                                            </div>
                                        </td>
                                        <td className="p-6">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                <CheckCircle className="w-3 h-3" />
                                                {sub.status || 'Locked'}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            {sub.grade !== null ? (
                                                <span className="text-xl font-bold text-green-400">{sub.grade}/100</span>
                                            ) : (
                                                <span className="text-gray-500 text-sm">--</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleGrade(sub.id)}
                                                    disabled={gradingId === sub.id}
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {gradingId === sub.id ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                                    {sub.grade !== null ? 'Regrade' : 'AI Grade'}
                                                </button>
                                                {sub.grade !== null && (
                                                    <button
                                                        onClick={() => {
                                                            setGradeResult({
                                                                submissionId: sub.id,
                                                                score: sub.grade,
                                                                feedback: sub.feedback,
                                                                ocr_text: "View OCR from AI Grade to see text", // Simplification as we don't have OCR text in list view
                                                                details: "Existing Grade"
                                                            });
                                                            setEditingScore(sub.grade);
                                                            setEditingFeedback(sub.feedback || "");
                                                        }}
                                                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                <a
                                                    href={getFileUrl(sub.file_path)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-black bg-amber-500 hover:bg-amber-400 rounded-lg transition-all"
                                                >
                                                    <Download size={16} />
                                                    View
                                                </a>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Grading Result Modal */}
            {gradeResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="text-purple-400" />
                                    AI Grading Results
                                </h2>
                                <button onClick={() => setGradeResult(null)} className="text-gray-400 hover:text-white">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="text-sm text-gray-400 mb-1">Overall Score (Editable)</div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={editingScore}
                                            onChange={(e) => setEditingScore(e.target.value)}
                                            className="text-4xl font-bold text-green-400 bg-transparent border-b border-white/20 w-32 focus:outline-none focus:border-green-400"
                                        />
                                        <span className="text-xl text-gray-500">/100</span>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                    <div className="text-sm text-gray-400 mb-1">Confidence / Status</div>
                                    <div className="text-lg font-medium text-white">{gradeResult.details}</div>
                                </div>
                            </div>

                            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-2">Feedback (Editable)</h3>
                                <textarea
                                    value={editingFeedback}
                                    onChange={(e) => setEditingFeedback(e.target.value)}
                                    rows={4}
                                    className="w-full bg-black/20 text-gray-300 leading-relaxed p-3 rounded-lg border border-white/10 focus:outline-none focus:border-blue-500 resize-none"
                                />
                            </div>

                            <div className="bg-black/40 p-4 rounded-xl border border-white/10">
                                <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">OCR Extracted Text</h3>
                                <div className="font-mono text-sm text-gray-300 whitespace-pre-wrap max-h-40 overflow-y-auto bg-black p-3 rounded-lg border border-white/5">
                                    {gradeResult.ocr_text || "No text extracted."}
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <div className="flex justify-between pt-2">
                                    <button
                                        onClick={() => setGradeResult(null)}
                                        className="px-6 py-2 text-gray-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveGrade}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {saving && <Loader2 className="animate-spin w-4 h-4" />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
