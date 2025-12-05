'use client';

export default function LessonPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-3xl font-bold mb-4 text-lumina-primary">Lesson Page</h1>
            <p className="text-gray-400">This is a placeholder for the Lesson page.</p>
            <a href="/student/dashboard" className="mt-4 inline-block text-lumina-secondary hover:underline">Back to Dashboard</a>
        </div>
    );
}
