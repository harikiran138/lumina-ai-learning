"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";

interface Assignment {
    id: string;
    course_id: string;
    type: "assignment";
    image_path: string;
    digital_text: string;
    score?: number;
    remarks?: string;
    status: string;
    timestamp: string;
}

export default function GradingPage() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [gradingId, setGradingId] = useState<string | null>(null);

    // Form State
    const [score, setScore] = useState("");
    const [remarks, setRemarks] = useState("");

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/handwriting/list?type=assignment`);
            const data = await res.json();
            setAssignments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleGrade = async (assignmentId: string) => {
        setGradingId(assignmentId);
        try {
            const formData = new FormData();
            formData.append("assignment_id", assignmentId);
            formData.append("score", score);
            formData.append("remarks", remarks);
            formData.append("user_id", "guest");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://127.0.0.1:8000'}/api/handwriting/grade`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                alert("Graded successfully!");
                fetchAssignments(); // Refresh
                setScore("");
                setRemarks("");
            } else {
                alert("Grading failed");
            }
        } catch (err) {
            alert("Error submitting grade");
        } finally {
            setGradingId(null);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Assignment Grading</h1>

            {loading ? (
                <Loader2 className="animate-spin w-8 h-8" />
            ) : (
                <div className="grid gap-6">
                    {assignments.length === 0 && <p>No assignments submitted.</p>}
                    {assignments.map((asm) => (
                        <div key={asm.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-6">

                            {/* Image Preview - Mock for now as raw path is local */}
                            <div className="w-full md:w-1/3 bg-gray-100 dark:bg-gray-900 rounded flex items-center justify-center p-4">
                                <div className="text-center">
                                    <p className="text-sm font-mono break-all">{asm.image_path.split('/').pop()}</p>
                                    <span className="text-xs text-gray-500">(Local File)</span>
                                </div>
                            </div>

                            {/* Content & Grading */}
                            <div className="flex-1 space-y-4">
                                <div>
                                    <h3 className="font-semibold text-lg">Student Submission</h3>
                                    <p className="text-sm text-gray-500 mb-2">{new Date(asm.timestamp).toLocaleString()}</p>

                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded h-32 overflow-y-auto text-sm font-mono border">
                                        {asm.digital_text || "No text extracted."}
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    {asm.status === "graded" ? (
                                        <div className="flex items-center gap-2 text-green-600">
                                            <CheckCircle className="w-5 h-5" />
                                            <div>
                                                <p className="font-bold">Score: {asm.score}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">"{asm.remarks}"</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-4">
                                                <input
                                                    type="number"
                                                    placeholder="Score (0-100)"
                                                    className="border p-2 rounded w-32 dark:bg-gray-700"
                                                    value={score}
                                                    onChange={(e) => setScore(e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Remarks / Feedback"
                                                    className="border p-2 rounded flex-1 dark:bg-gray-700"
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleGrade(asm.id)}
                                                disabled={gradingId === asm.id || !score}
                                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50 self-start"
                                            >
                                                {gradingId === asm.id ? "Submitting..." : "Submit Grade"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
