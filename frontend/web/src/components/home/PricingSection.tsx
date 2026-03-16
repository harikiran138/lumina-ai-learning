"use client";

import { Check, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Standard",
    price: "Free",
    description: "Ideal for individual students and small study groups.",
    features: [
      "AI Personal Tutor (Basic)",
      "Adaptive Learning Pathways",
      "Teacher-Verified Content",
      "Progress Dashboard",
      "Community Support",
      "Standard Study Tools"
    ],
    cta: "Start Learning",
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "Designed for universities, schools, and large institutions.",
    features: [
      "Full AI Learning Engine Access",
      "Institutional Dashboards & Analytics",
      "Bulk Content Migration (AI-powered)",
      "Deep Canvas/Moodle Integration",
      "Research & Policy Insights",
      "24/7 Dedicated Support",
      "Priority Teacher Verification"
    ],
    cta: "Contact Sales",
    popular: true
  }
];

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Scalable for Every Institution
          </h2>
          <p className="text-lg text-gray-400">
            Choose the best plan to transform your learning environment with Lumina's privacy-first AI architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, index) => (
            <div 
              key={index} 
              className={`glass-v2 p-8 lg:p-10 flex flex-col relative ${
                tier.popular ? "border-lumina-primary/50 shadow-[0_0_40px_rgba(255,183,0,0.1)]" : "border-white/5"
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-10 -translate-y-1/2 bg-lumina-primary text-black text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                  Recommended
                </div>
              )}
              
              <div className="mb-10">
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-bold text-white">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="text-gray-500">/mo</span>}
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-grow">
                {tier.features.map((feature, fIndex) => (
                  <li key={fIndex} className="flex items-start space-x-3 text-sm text-gray-300">
                    <Check className="h-5 w-5 text-lumina-primary shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                variant={tier.popular ? "default" : "outline"}
                className={`w-full py-6 rounded-xl font-bold text-base transition-all duration-300 ${
                  tier.popular 
                    ? "bg-lumina-primary text-black hover:scale-[1.02]" 
                    : "glass-button-secondary border-white/10 hover:bg-white/5"
                }`}
              >
                {tier.cta} <MoveRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Interested in specialized research partnerships? <button className="text-lumina-primary hover:underline">Apply for research access</button>
          </p>
        </div>
      </div>
    </section>
  );
}
