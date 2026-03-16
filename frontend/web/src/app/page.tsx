"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { DottedSurface } from "@/components/ui/DottedSurface";
import HeroSection from "@/components/home/HeroSection";

// Lazy load heavy sections
const ProblemSection = dynamic(() => import("@/components/home/ProblemSection"), { ssr: false });
const SolutionSection = dynamic(() => import("@/components/home/SolutionSection"), { ssr: false });
const HowItWorksSection = dynamic(() => import("@/components/home/HowItWorksSection"), { ssr: false });
const RoleCards = dynamic(() => import("@/components/home/RoleCards"), { ssr: false });
const EngineSection = dynamic(() => import("@/components/home/EngineSection"), { ssr: false });
const VerificationSection = dynamic(() => import("@/components/home/VerificationSection"), { ssr: false });
const PrivacySection = dynamic(() => import("@/components/home/PrivacySection"), { ssr: false });
const ArchitectureSection = dynamic(() => import("@/components/home/ArchitectureSection"), { ssr: false });
const BenefitsSection = dynamic(() => import("@/components/home/BenefitsSection"), { ssr: false });
const ScreenshotsSection = dynamic(() => import("@/components/home/ScreenshotsSection"), { ssr: false });
const ImpactSection = dynamic(() => import("@/components/home/ImpactSection"), { ssr: false });
const PricingSection = dynamic(() => import("@/components/home/PricingSection"), { ssr: false });
const CTASection = dynamic(() => import("@/components/home/CTASection"), { ssr: false });
const Footer = dynamic(() => import("@/components/layout/Footer"), { ssr: false });
const StructuredData = dynamic(() => import("@/components/seo/StructuredData"), { ssr: false });

// Keeping existing sections for fallback/compatibility if needed
const TestimonialsSection = dynamic(() => import("@/components/home/TestimonialsSection"), { ssr: false });

export default function Home() {
  const [sectionsVisible, setSectionsVisible] = useState({
    problem: false,
    solution: false,
    howItWorks: false,
    roles: false,
    engine: false,
    verification: false,
    privacy: false,
    architecture: false,
    benefits: false,
    screenshots: false,
    impact: false,
    testimonials: false,
    pricing: false,
    cta: false,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            // Map hyphenated IDs to state keys
            const stateKey = sectionId.replace(/-([a-z])/g, (g) => g[1].toUpperCase()) as keyof typeof sectionsVisible;
            setSectionsVisible((prev) => ({ ...prev, [stateKey]: true }));
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "200px" },
    );

    const sections = [
      "problem", "solution", "how-it-works", "roles", 
      "engine", "verification", "privacy", "architecture", 
      "benefits", "screenshots", "impact", "testimonials", "pricing", "cta"
    ];

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="text-white min-h-screen bg-surface-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 bg-surface-950/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex-shrink-0">
              <Link href="/" className="text-2xl font-bold text-white flex items-center">
                <span className="gradient-text">Lumina</span> ✨
              </Link>
            </div>
            
            <nav className="hidden lg:flex md:items-center md:space-x-8">
              {["Features", "Roles", "Engine", "Privacy", "Impact"].map((item) => (
                <Link
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-gray-400 hover:text-lumina-primary transition-colors"
                >
                  {item}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-6">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="bg-lumina-primary text-black font-bold py-2.5 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main>
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
        
        <div id="engine">
          {sectionsVisible.engine && <EngineSection />}
        </div>
        
        <div id="verification">
          {sectionsVisible.verification && <VerificationSection />}
        </div>
        
        <div id="privacy">
          {sectionsVisible.privacy && <PrivacySection />}
        </div>
        
        <div id="architecture">
          {sectionsVisible.architecture && <ArchitectureSection />}
        </div>
        
        <div id="benefits">
          {sectionsVisible.benefits && <BenefitsSection />}
        </div>
        
        <div id="screenshots">
          {sectionsVisible.screenshots && <ScreenshotsSection />}
        </div>
        
        <div id="impact">
          {sectionsVisible.impact && <ImpactSection />}
        </div>
        
        <div id="testimonials">
          {sectionsVisible.testimonials && <TestimonialsSection />}
        </div>
        
        <div id="pricing">
          {sectionsVisible.pricing && <PricingSection />}
        </div>
        
        <div id="cta">
          {sectionsVisible.cta && <CTASection />}
        </div>
      </main>

      <Footer />
      <StructuredData />
      
      {/* Global Background Dots */}
      <DottedSurface />
    </div>
  );
}
