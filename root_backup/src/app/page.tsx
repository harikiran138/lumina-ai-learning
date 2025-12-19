import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { DottedSurface } from '@/components/ui/DottedSurface';

export default function Home() {
    return (
        <div className="text-white min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex-shrink-0">
                            <Link href="/" className="text-2xl font-bold text-white">
                                <span className="gradient-text">Lumina</span> ✨
                            </Link>
                        </div>
                        <div className="hidden md:flex md:items-center md:space-x-8">
                            <Link href="#features" className="text-gray-300 hover:text-amber-400 transition-colors">
                                Features
                            </Link>
                            <Link href="#for-who" className="text-gray-300 hover:text-amber-400 transition-colors">
                                For Who?
                            </Link>
                            <Link href="#testimonials" className="text-gray-300 hover:text-amber-400 transition-colors">
                                Testimonials
                            </Link>
                            <Link href="/login" className="text-gray-300 hover:text-amber-400 transition-colors">
                                Sign In
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href="/login" className="hidden md:inline-block bg-amber-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-amber-600 transition-colors">
                                Get Started
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                {/* Hero Section */}
                <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                    <DottedSurface />
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center py-16">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                            The Future of Learning, <br /> <span className="gradient-text">Personalized for You.</span>
                        </h1>
                        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
                            Lumina is an AI-driven, self-hosted platform that transforms your course materials into adaptive
                            learning pathways, automated assessments, and engaging experiences.
                        </p>
                        <div className="mt-8 flex justify-center space-x-4">
                            <Link href="/login" className="bg-amber-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-amber-600 transition-colors text-lg shadow-lg shadow-amber-500/20">
                                Start Learning
                            </Link>
                            <Link href="#features" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 px-8 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg shadow-lg dark:shadow-white/5">
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
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

                {/* For Who Section */}
                <section id="for-who" className="min-h-screen flex items-center">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold gradient-text">Built for Modern Education</h2>
                            <p className="mt-4 text-lg text-gray-300">Empowering every stakeholder in the learning journey.</p>
                        </div>
                        <div className="mt-12 grid gap-8 md:grid-cols-3">
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
                                <h3 className="text-xl font-bold gradient-text">For Students</h3>
                                <p className="mt-4 text-gray-300">Experience learning that adapts to your pace. Get instant feedback, track your progress with engaging streaks, and never feel overwhelmed again.</p>
                            </div>
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
                                <h3 className="text-xl font-bold gradient-text">For Teachers</h3>
                                <p className="mt-4 text-gray-300">Automate the tedious work. Convert your existing materials into interactive courses, generate assessments instantly, and get deep insights into class performance.</p>
                            </div>
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
                                <h3 className="text-xl font-bold gradient-text">For Institutions</h3>
                                <p className="mt-4 text-gray-300">Own your educational ecosystem. Lumina is a scalable, secure, and private solution that integrates with your existing LMS and respects data sovereignty.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
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

                {/* Testimonials Section */}
                <section id="testimonials" className="min-h-screen flex items-center">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold gradient-text">Loved by Educators & Students</h2>
                            <p className="mt-4 text-lg text-gray-300">Don't just take our word for it. Here's what people are saying.</p>
                        </div>
                        <div className="mt-12 grid gap-8 md:grid-cols-2">
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
                                <p className="text-gray-300">"Lumina has been a game-changer for my classroom. I can finally spend more time teaching and less time creating materials. The students are more engaged than ever before!"</p>
                                <div className="flex items-center mt-6">
                                    <img className="h-12 w-12 rounded-full object-cover" src="https://placehold.co/100x100/7c3aed/white?text=E" alt="Evelyn Reed" />
                                    <div className="ml-4">
                                        <p className="font-semibold">Prof. Evelyn Reed</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Physics Professor</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-white/20">
                                <p className="text-gray-300">"The personalized pathway helped me focus on my weak spots in chemistry. The streak feature is surprisingly motivating, and I actually enjoy studying now."</p>
                                <div className="flex items-center mt-6">
                                    <img className="h-12 w-12 rounded-full object-cover" src="https://placehold.co/100x100/f59e0b/white?text=A" alt="Alex Turner" />
                                    <div className="ml-4">
                                        <p className="font-semibold">Alex Turner</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">University Student</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white/5 backdrop-blur-sm border-t border-white/10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center text-gray-600 dark:text-gray-400">
                        <span className="gradient-text font-semibold">&copy; 2025 Lumina. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
