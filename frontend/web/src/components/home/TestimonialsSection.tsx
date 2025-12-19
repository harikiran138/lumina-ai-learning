
export default function TestimonialsSection() {
    return (
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
    );
}
