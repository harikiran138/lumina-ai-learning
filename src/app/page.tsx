import Link from 'next/link';

export default function HomePage() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-black via-lumina-dark-gray to-black">
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Animated Background - Golden Glow */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-lumina-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-lumina-secondary/15 rounded-full blur-3xl animate-pulse-slow"></div>
                </div>

                {/* Content */}
                <div className="relative container mx-auto px-6 py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Logo/Title */}
                        <h1 className="text-7xl font-bold mb-6 animate-float">
                            <span className="text-gradient">Lumina</span>
                        </h1>


                        <p className="text-2xl text-lumina-accent mb-4">
                            Intelligent AI Dashboard
                        </p>

                        <p className="text-lg text-lumina-accent/80 mb-12 max-w-2xl mx-auto">
                            Production-grade AI learning platform powered by multi-agent workflow intelligence.
                            Secure backend APIs, cloud database integration, and real-time collaboration.
                            <span className="block mt-2 text-lumina-primary font-semibold">Now with Premium Golden Yellow & Black Theme ✨</span>
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex gap-4 justify-center flex-wrap">
                            <Link href="/login" className="btn-primary">
                                Get Started
                            </Link>
                            <Link href="/api/db/test" target="_blank" className="btn-secondary">
                                Test Database
                            </Link>
                            <Link href="/dashboard" className="btn-secondary">
                                View Dashboard
                            </Link>
                        </div>

                        {/* Status Indicators */}
                        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="card text-center">
                                <div className="text-4xl font-bold text-gradient mb-2">6</div>
                                <div className="text-gray-400">AI Agents</div>
                            </div>
                            <div className="card text-center">
                                <div className="text-4xl font-bold text-gradient mb-2">100%</div>
                                <div className="text-gray-400">Secure</div>
                            </div>
                            <div className="card text-center">
                                <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
                                <div className="text-gray-400">Active</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="relative py-20">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold text-center mb-12">
                        <span className="text-gradient">Key Features</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {[
                            {
                                title: 'Database Integration',
                                description: 'PostgreSQL with Prisma ORM, migrations, and auto-seeding',
                                icon: '🗄️',
                            },
                            {
                                title: 'Secure Backend APIs',
                                description: 'JWT authentication, protected routes, and session management',
                                icon: '🔐',
                            },
                            {
                                title: 'Multi-Agent System',
                                description: 'Research, UI/UX, Code, Database, and Test agents working together',
                                icon: '🤖',
                            },
                            {
                                title: 'Real-time Updates',
                                description: 'Live agent status and task progress indicators',
                                icon: '⚡',
                            },
                            {
                                title: 'Premium UI/UX',
                                description: 'Dark mode, glass morphism, and smooth animations',
                                icon: '✨',
                            },
                            {
                                title: 'Cloud Deployment',
                                description: 'Optimized for Vercel with cloud PostgreSQL',
                                icon: '☁️',
                            },
                        ].map((feature, index) => (
                            <div key={index} className="card-hover">
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative py-12 border-t border-white/10">
                <div className="container mx-auto px-6 text-center text-gray-400">
                    <p>Lumina AI Learning Platform v2.0 &copy; 2025</p>
                    <p className="text-sm mt-2">
                        Built with Next.js, Prisma, PostgreSQL, and OpenAI
                    </p>
                </div>
            </footer>
        </main>
    );
}
