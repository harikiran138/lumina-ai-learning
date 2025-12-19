"use client";

import { useState } from "react";
import { Upload, FileText, CheckCircle, Loader2 } from "lucide-react";

interface UploadProps {
    type: "assignment" | "note";
    userId?: string;
    assignmentId?: string;
    onUploadComplete?: (data: any) => void;
}

export default function HandwritingUpload({ type, userId = "guest", assignmentId, onUploadComplete }: UploadProps) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        formData.append("user_id", userId);
        if (assignmentId) formData.append("assignment_id", assignmentId);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
            const response = await fetch(`${API_URL}/api/handwriting/upload`, {
                method: "POST",
                body: formData,
            });

            const data = await response.json();
            if (data.status === "success") {
                setResult(data.data);
                if (onUploadComplete) onUploadComplete(data.data);
            } else {
                alert("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Error uploading file");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 border border-gray-200 rounded-xl bg-white/5 backdrop-blur-sm">
            <h3 className="text-lg font-semibold mb-4 capitalize">Upload {type}</h3>

            <div className="flex flex-col gap-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                        id={`file-upload-${type}`}
                    />
                    <label htmlFor={`file-upload-${type}`} className="cursor-pointer flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-500">
                            {file ? file.name : "Click to select handwriting image"}
                        </span>
                    </label>
                </div>

                <button
                    onClick={handleUpload}
                    disabled={!file || loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    {loading ? "Digitizing (~30s)..." : "Convert & Upload"}
                </button>

                {result && (
                    <div className="mt-4 p-4 bg-green-50/10 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Success!</span>
                        </div>

                        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                            <p><strong>Digitized Text:</strong></p>
                            <div className="bg-black/5 p-2 rounded max-h-32 overflow-y-auto font-mono text-xs">
                                {result.digital_text || "No text extracted (Mock)"}
                            </div>

                            {type === "note" && result.ai_analysis && (
                                <>
                                    <p className="mt-2"><strong>AI Summary & Improvements:</strong></p>
                                    <div className="bg-blue-50/10 p-2 rounded max-h-40 overflow-y-auto text-xs whitespace-pre-wrap">
                                        {result.ai_analysis}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
