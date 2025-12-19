
export default function ForWhoSection() {
    return (
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
    );
}
