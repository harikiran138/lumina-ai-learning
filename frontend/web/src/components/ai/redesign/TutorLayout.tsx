"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

interface TutorLayoutProps {
  sidebar: ReactNode;
  conversation: ReactNode;
  intelligence?: ReactNode;
  className?: string;
}

export function TutorLayout({
  sidebar,
  conversation,
  intelligence,
  className,
}: TutorLayoutProps) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setLeftOpen(false);
        setRightOpen(false);
      } else {
        setLeftOpen(true);
        setRightOpen(true);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      className={cn(
        "flex h-screen w-full command-center-bg text-white overflow-hidden font-sans",
        className,
      )}
    >
      <div className="neural-mesh opacity-30" />

      {/* LEFT PANEL (Sidebar) */}
      <aside
        className={cn(
          "flex-shrink-0 border-r border-white/5 transition-all duration-300 ease-in-out relative z-20 backdrop-blur-xl bg-black/20",
          leftOpen ? "w-[280px]" : "w-0 opacity-0 overflow-hidden",
        )}
      >
        <div className="h-full w-[280px] overflow-hidden">{sidebar}</div>
      </aside>

      {/* CENTER PANEL (Conversation) */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Toggle Controls (Floating or Header) */}
        <div className="absolute top-4 left-4 z-50 flex gap-2">
          {!leftOpen && (
            <button
              onClick={() => setLeftOpen(true)}
              className="p-2 glass-button-secondary !py-2 !px-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {intelligence && !rightOpen && (
            <button
              onClick={() => setRightOpen(true)}
              className="p-2 glass-button-secondary !py-2 !px-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <PanelRightClose className="w-4 h-4" />{" "}
              {/* Use Close icon logic reversed for expand */}
            </button>
          )}
        </div>

        {conversation}
      </main>

      {/* RIGHT PANEL (Intelligence) */}
      {intelligence && (
        <aside
          className={cn(
            "flex-shrink-0 border-l border-white/5 transition-all duration-300 ease-in-out relative z-20 backdrop-blur-xl bg-black/20",
            rightOpen ? "w-[320px]" : "w-0 opacity-0 overflow-hidden",
          )}
        >
          <div className="absolute top-4 left-4 z-50">
            {/* Close button internal to panel for cleaner look */}
            <button
              onClick={() => setRightOpen(false)}
              className="p-2 hover:bg-white/5 rounded-md text-gray-500 hover:text-white transition-colors"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>
          {/* Internal wrapper to prevent content squish during transition */}
          <div className="h-full w-[320px] overflow-hidden">{intelligence}</div>
        </aside>
      )}
      {/* Left toggle inside panel */}
      {leftOpen && (
        <div className="absolute bottom-6 left-[230px] z-50">
          <button
            onClick={() => setLeftOpen(false)}
            className="p-2 hover:bg-white/5 rounded-md text-gray-500 hover:text-white transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
