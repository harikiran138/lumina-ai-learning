"use client";

import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Lumina has completely transformed how I track student mastery. The AI tutor handles the basics, allowing me to focus on deep, meaningful teaching.",
    author: "Dr. Marcus Thorne",
    role: "Department Head, Science",
    institution: "St. Jude's Academy"
  },
  {
    quote: "The privacy-first approach was the deciding factor for us. We trust Lumina with our student data, and the results speak for themselves.",
    author: "Elena Rodriguez",
    role: "Educational Technologist",
    institution: "Regional School Board"
  },
  {
    quote: "I've never seen such high student engagement. They love their AI tutor, and I love the insights I get into their learning gaps.",
    author: "James Wilson",
    role: "High School Teacher",
    institution: "Lincoln Prep"
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-neutral-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6 font-display">
            Trusted by <span className="gradient-text">Educators</span>
          </h2>
          <p className="text-lg text-zinc-400 font-sans">
            Hear from the teachers and administrators who are leading the AI educational revolution with Lumina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-v2-primary p-10 flex flex-col group hover:-translate-y-2 transition-all duration-500">
              <Quote className="h-10 w-10 text-lumina-primary/20 mb-6 group-hover:text-lumina-primary transition-colors" />
              <p className="text-lg text-zinc-300 italic mb-8 font-sans leading-relaxed">
                "{t.quote}"
              </p>
              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-white font-bold font-display">{t.author}</p>
                <p className="text-xs text-lumina-primary font-bold uppercase tracking-widest">{t.role}</p>
                <p className="text-xs text-zinc-500 font-sans">{t.institution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
