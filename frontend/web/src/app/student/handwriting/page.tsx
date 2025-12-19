"use client";

import HandwritingUpload from "@/components/HandwritingUpload";

export default function HandwritingPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">My Handwriting & Assignments</h1>
            <p className="text-gray-500 mb-8">Digitize your notes and submit handwritten assignments.</p>

            <div className="grid md:grid-cols-2 gap-8">
                <section>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">Upload Assignment</h2>
                        <p className="text-sm text-gray-500">Submit your written work for grading.</p>
                    </div>
                    <HandwritingUpload type="assignment" />
                </section>

                <section>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">Digitize Notes</h2>
                        <p className="text-sm text-gray-500">Get AI summaries and improvements.</p>
                    </div>
                    <HandwritingUpload type="note" />
                </section>
            </div>
        </div>
    );
}
