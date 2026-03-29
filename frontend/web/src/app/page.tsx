"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { DottedSurface } from "@/components/ui/DottedSurface";
import HeroSection from "@/components/home/HeroSection";

const ProblemSection = dynamic(() => import("@/components/home/ProblemSection"), { ssr: false });
const SolutionSection = dynamic(() => import("@/components/home/SolutionSection"), { ssr: false });
const HowItWorksSection = dynamic(() => import("@/components/home/HowItWorksSection"), { ssr: false });
const RoleCards = dynamic(() => import("@/components/home/RoleCards"), { ssr: false });
const AIEngineSection = dynamic(() => import("@/components/home/AIEngineSection"), { ssr: false });
const TeacherVerifySection = dynamic(() => import("@/components/home/TeacherVerifySection"), { ssr: false });
const PrivacySection = dynamic(() => import("@/components/home/PrivacySection"), { ssr: false });
const ProductCarousel = dynamic(() => import("@/components/home/ProductCarousel"), { ssr: false });
const BenefitsSection = dynamic(() => import("@/components/home/BenefitsSection"), { ssr: false });
const ResearchSection = dynamic(() => import("@/components/home/ResearchSection"), { ssr: false });
const TestimonialsSection = dynamic(() => import("@/components/home/TestimonialsSection"), { ssr: false });
const FinalCTASection = dynamic(() => import("@/components/home/FinalCTASection"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });
const StructuredData = dynamic(() => import("@/components/seo/StructuredData"), { ssr: false });

export default function Home() {
  const [sectionsVisible, setSectionsVisible] = useState({
    problem: false,
    solution: false,
    howItWorks: false,
    roles: false,
    aiEngine: false,
    verification: false,
    privacy: false,
    productScreens: false,
    benefits: false,
    research: false,
    testimonials: false,
    cta: false,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            const stateKey = sectionId.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof sectionsVisible;
            setSectionsVisible((prev) => ({ ...prev, [stateKey]: true }));
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "400px" },
    );

    const sections = [
      "problem", "solution", "how-it-works", "roles",
      "ai-engine", "verification", "privacy", "product-screens",
      "benefits", "research", "testimonials", "cta",
    ];

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="text-white min-h-screen bg-black selection:bg-lumina-highlight/40 selection:text-white">
      <header className="fixed top-0 left-0 right-0 z-[100] border-b border-lumina-highlight/5 bg-black/60 backdrop-blur-3xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-black text-white flex items-center font-display tracking-tight group">
                <span className="gradient-text transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">Lumina</span>
                <span className="ml-1 text-lumina-highlight">AI</span>
              </Link>
            </div>

            <nav className="hidden xl:flex md:items-center md:space-x-8">
              {[
                { label: "How It Works", href: "#how-it-works" },
                { label: "Roles", href: "#roles" },
                { label: "Verification", href: "#verification" },
                { label: "Privacy", href: "#privacy" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-lumina-highlight transition-all duration-300"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-6">
              <Link
                href="/login"
                className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="glass-button-highlight text-black text-xs font-bold uppercase tracking-[0.2em] py-3.5 px-8 rounded-xl hover:scale-[1.05] active:scale-[0.98] transition-all"
              >
                Get Started
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="relative">
        <HeroSection />

        <div id="problem">
          {sectionsVisible.problem && <ProblemSection />}
        </div>

        <div id="solution">
          {sectionsVisible.solution && <SolutionSection />}
        </div>

        <div id="how-it-works">
          {sectionsVisible.howItWorks && <HowItWorksSection />}
        </div>

        <div id="roles">
          {sectionsVisible.roles && <RoleCards />}
        </div>

        <div id="ai-engine">
          {sectionsVisible.aiEngine && <AIEngineSection />}
        </div>

        <div id="verification">
          {sectionsVisible.verification && <TeacherVerifySection />}
        </div>

        <div id="privacy">
          {sectionsVisible.privacy && <PrivacySection />}
        </div>

        <div id="product-screens">
          {sectionsVisible.productScreens && <ProductCarousel />}
        </div>

        <div id="benefits">
          {sectionsVisible.benefits && <BenefitsSection />}
        </div>

        <div id="research">
          {sectionsVisible.research && <ResearchSection />}
        </div>

        <div id="testimonials">
          {sectionsVisible.testimonials && <TestimonialsSection />}
        </div>

        <div id="cta">
          {sectionsVisible.cta && <FinalCTASection />}
        </div>
      </main>

      <Footer />
      <StructuredData />

      <DottedSurface />
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 left-0 w-full h-full neural-mesh opacity-[0.03]" />
      </div>
    </div>
  );
}
