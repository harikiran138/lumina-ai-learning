
export default function FeaturesSection() {
    return (
        <section id="features" className="min-h-screen flex items-center">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center">
                    <h2 className="text-3xl font-bold gradient-text">Why Lumina?</h2>
                    <p className="mt-4 text-lg text-gray-300">An all-in-one, ethical, and private education ecosystem.</p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col items-center text-center p-6 rounded-2xl transition-all bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="bg-transparent p-4 rounded-full text-amber-600 dark:text-amber-400">
                            <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547a2 2 0 01-1.022.547m16.5 0a2 2 0 01.547 1.022l.477 2.387a6 6 0 01-.517 3.86l-.158.318a6 6 0 01-.517 3.86l-2.387.477a2 2 0 01-.547 1.022m-16.5 0a2 2 0 00-.547-1.022l-.477-2.387a6 6 0 00.517-3.86l.158-.318a6 6 0 00.517-3.86l2.387-.477a2 2 0 00.547-1.022m16.5 0l-3.473 3.473m0 0a3 3 0 10-4.243-4.243l-3.473-3.473a3 3 0 00-4.243 4.243l3.473 3.473a3 3 0 004.243 4.243z" />
                            </svg>
                        </div>
                        <h3 className="mt-5 text-xl font-semibold gradient-text">Adaptive Pathways</h3>
                        <p className="mt-2 text-gray-300">AI generates personalized learning roadmaps based on student performance and engagement.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 rounded-2xl transition-all bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="bg-transparent p-4 rounded-full text-amber-600 dark:text-amber-400">
                            <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <h3 className="mt-5 text-xl font-semibold gradient-text">Automated Assessments</h3>
                        <p className="mt-2 text-gray-300">Save time with AI-generated questions, auto-grading, and insightful feedback.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 rounded-2xl transition-all bg-white/10 dark:bg-white/5 backdrop-blur-lg border border-white/20 shadow-xl">
                        <div className="bg-transparent p-4 rounded-full text-amber-600 dark:text-amber-400">
                            <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="mt-5 text-xl font-semibold gradient-text">Self-Hosted & Private</h3>
                        <p className="mt-2 text-gray-300">Run Lumina on your own servers. No external APIs, full data sovereignty, and complete privacy.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
