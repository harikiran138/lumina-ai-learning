
export default function HowItWorksSection() {
    return (
        <section id="how-it-works" className="min-h-screen flex items-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center">
                    <h2 className="text-3xl font-bold gradient-text">A Seamless Workflow</h2>
                    <p className="mt-4 text-lg text-gray-300">From raw text to personalized education in a few simple steps.</p>
                </div>
                <div className="mt-12 relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-300 dark:bg-gray-700 -translate-y-1/2"></div>
                    <div className="grid gap-12 md:grid-cols-3 relative">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border-2 border-white/20 h-16 w-16 rounded-full flex items-center justify-center text-amber-500 font-bold text-2xl relative z-10">1</div>
                            <h3 className="mt-4 text-xl font-semibold gradient-text">Upload Content</h3>
                            <p className="mt-2 text-gray-300">Teachers upload textbooks, syllabi, or any course document.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border-2 border-white/20 h-16 w-16 rounded-full flex items-center justify-center text-amber-500 font-bold text-2xl relative z-10">2</div>
                            <h3 className="mt-4 text-xl font-semibold gradient-text">AI Generates Pathway</h3>
                            <p className="mt-2 text-gray-300">Lumina processes the content and creates a structured, adaptive course.</p>
                        </div>
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg border-2 border-white/20 h-16 w-16 rounded-full flex items-center justify-center text-amber-500 font-bold text-2xl relative z-10">3</div>
                            <h3 className="mt-4 text-xl font-semibold gradient-text">Students Engage & Grow</h3>
                            <p className="mt-2 text-gray-300">Students follow their unique path, take quizzes, and track their progress.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
