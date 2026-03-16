"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dr. Sarah Chen",
    role: "Dean of Innovation, Stamford University",
    quote: "Lumina's privacy-first architecture allowed us to deploy AI safely across campus. The teacher verification system is a game-changer for academic integrity.",
    avatar: "SC"
  },
  {
    name: "Marcus Thorne",
    role: "Biology Lead, North Highland High",
    quote: "The ability to transform my existing lecture notes into an interactive, adaptive study guide in minutes has recovered hours of my weekly planning time.",
    avatar: "MT"
  },
  {
    name: "James Wilson",
    role: "Education Policy Researcher",
    quote: "The anonymized data streams from Lumina provide unprecedented insights into how students learn, without compromising their individual privacy.",
    avatar: "JW"
  }
];

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden bg-surface-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Trusted by Educators & Researchers
          </h2>
          <p className="text-lg text-gray-400">
            Join the growing network of institutions redefining the future of learning with Lumina.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="glass-v2 p-8 relative flex flex-col group hover:border-lumina-primary/30 transition-all duration-500"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 glass rounded-2xl flex items-center justify-center text-lumina-primary shadow-xl">
                <Quote className="h-6 w-6" />
              </div>

              <div className="flex mb-6 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-lumina-primary text-lumina-primary" />
                ))}
              </div>

              <blockquote className="text-gray-300 mb-8 italic text-lg leading-relaxed flex-grow">
                "{testimonial.quote}"
              </blockquote>

              <div className="flex items-center space-x-4 border-t border-white/5 pt-6">
                <div className="w-12 h-12 rounded-xl bg-lumina-primary/10 flex items-center justify-center font-bold text-lumina-primary group-hover:bg-lumina-primary group-hover:text-black transition-colors duration-300">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="text-white font-bold">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
