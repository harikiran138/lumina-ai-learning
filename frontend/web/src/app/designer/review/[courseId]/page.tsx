"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Library,
  CheckCircle,
  XCircle,
  X,
  ArrowLeft 
} from "lucide-react";

export default function DesignerReviewPage() {
  const router = useRouter();
  const { courseId } = useParams() as { courseId: string };
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourse(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/content-designer/courses/${courseId}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      if (res.ok) router.push("/designer");
    } catch (err) {
      console.error("Failed to approve", err);
    }
  };

  const handleReject = async () => {
    if (!feedback.trim()) return alert("Please provide feedback for rejection.");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/content-designer/courses/${courseId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ feedback }),
      });
      if (res.ok) router.push("/designer");
    } catch (err) {
      console.error("Failed to reject", err);
    }
  };

  if (loading) return <div className="p-8 text-neutral-300">Loading course {courseId}...</div>;
  if (!course) return <div className="p-8 text-red-400">Course not found.</div>;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => router.push("/designer")}
          className="flex items-center space-x-2 text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Queue</span>
        </button>

        <div className="bg-neutral-800 rounded-xl p-8 border border-neutral-700 shadow-xl relative">
          <div className="absolute top-8 right-8 flex space-x-3">
            <button 
              onClick={() => setRejecting(true)}
              className="px-4 py-2 bg-neutral-700 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              Reject with Edits
            </button>
            <button 
              onClick={handleApprove}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary-500/20"
            >
              Approve & Publish
            </button>
          </div>

          <h1 className="text-3xl font-bold mb-2 pr-64">{course.name}</h1>
          <p className="text-neutral-400 mb-8">{course.description}</p>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-neutral-700 pb-2">Course Blueprint / Modules</h2>
            {course.modules?.length === 0 ? (
              <p className="text-neutral-500 italic">No modules defined yet.</p>
            ) : (
              course.modules?.map((mod: any, i: number) => (
                <div key={i} className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                  <h3 className="font-medium text-lg mb-2">Module {i+1}: {mod.title}</h3>
                  <p className="text-sm text-neutral-400 mb-4">{mod.description}</p>
                  
                  {mod.units?.length > 0 && (
                    <div className="space-y-2">
                      {mod.units.map((unit: any, j: number) => (
                        <div key={j} className="flex justify-between items-center text-sm py-2 border-t border-neutral-800">
                          <span className="font-medium text-neutral-300">{unit.title}</span>
                          <span className="text-xs text-neutral-500">{unit.type || "unknown"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {rejecting && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-neutral-800 w-full max-w-lg rounded-2xl p-6 border border-neutral-700 shadow-2xl relative">
            <button 
              onClick={() => setRejecting(false)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <XCircle className="w-6 h-6 text-red-400 mr-2" />
              Reject Course
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              Provide feedback for the faculty member so they know what needs to be changed before this course can be published.
            </p>
            
            <textarea
              className="w-full h-32 bg-neutral-900 border border-neutral-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-6"
              placeholder="e.g. Unit 3 is missing supplementary materials, and the syllabus phrasing needs to be aligned with college standards..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setRejecting(false)}
                className="px-4 py-2 hover:bg-neutral-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
