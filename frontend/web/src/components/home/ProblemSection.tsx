"use client";

import { AlertCircle, Clock, BarChart3, Users, BookOpen } from "lucide-react";

const problems = [
  {
    icon: Clock,
    title: "Teacher Workload",
    description: "Teachers spend too much time on administrative tasks instead of teaching."
  },
  {
    icon: BookOpen,
    title: "One-Size-Fits-All",
    description: "Traditional learning systems treat every student the same, ignoring individual needs."
  },
  {
    icon: AlertCircle,
    title: "Lack of Personalization",
    description: "Students struggle to master complex topics without instant, personalized feedback."
  },
  {
    icon: BarChart3,
    title: "Data Silos",
    description: "Valuable learning data remains trapped in legacy LMS, providing zero insights."
  },
  {
    icon: Users,
    title: "Student Disengagement",
    description: "Static content fails to engage modern students who expect interactive experiences."
  }
];

export default function ProblemSection() {
  return (
    <section className="py-24 relative overflow-hidden bg-surface-950/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            The Digital Learning Gap
          </h2>
          <p className="text-lg text-gray-400">
            Education is evolving, but our tools are stuck in the past. Lumina solves the core limitations of traditional educational technology.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <div key={index} className="glass-v2 p-8 group">
              <div className="w-12 h-12 rounded-xl bg-lumina-primary/10 flex items-center justify-center mb-6 group-hover:bg-lumina-primary/20 transition-colors">
                <problem.icon className="h-6 w-6 text-lumina-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{problem.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {problem.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
