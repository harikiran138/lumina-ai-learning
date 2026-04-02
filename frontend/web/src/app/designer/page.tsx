"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Library, 
  CheckCircle, 
  Clock
} from "lucide-react";
import { RealAPI } from "@/lib/api";

interface Course {
  id: string;
  name: string;
  code: string;
  teacher_id: string;
  review_status: string;
  created_at: string;
}

export default function DesignerDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const data = await RealAPI.getInstance().getDesignerQueue();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Library className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold">Content Designer Review Queue</h1>
        </div>

        {loading ? (
          <div className="flexjustify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-neutral-800 rounded-xl p-12 text-center text-neutral-400">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500/50" />
            <p className="text-xl">Your queue is empty!</p>
            <p className="mt-2 text-sm">No courses are currently pending review.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div 
                key={course.id} 
                className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 hover:border-primary-500/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/designer/review/${course.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>Needs Review</span>
                  </div>
                  <span className="text-xs text-neutral-500 uppercase tracking-wider">{course.code}</span>
                </div>
                
                <h3 className="text-xl font-semibold mb-2 line-clamp-2">{course.name}</h3>
                
                <div className="flex justify-between items-end mt-6 pt-4 border-t border-neutral-700">
                  <div className="text-sm text-neutral-400">
                    <span className="block text-xs uppercase text-neutral-500">Submitted</span>
                    {new Date(course.created_at).toLocaleDateString()}
                  </div>
                  <button className="text-primary-400 font-medium text-sm hover:text-primary-300">
                    Review Course &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
