"use client";

import React from "react";

/**
 * AuthSkeleton
 * 
 * A sleek, shimmer-based skeleton loader that mimics the layout of the 
 * AuthGateway to prevent layout shift and provide immediate feedback.
 */
export default function AuthSkeleton() {
  return (
    <div className="min-h-screen bg-[#060606] text-slate-100 flex overflow-hidden">
      {/* Left Panel Skeleton (Desktop) */}
      <div className="hidden lg:flex lg:w-[44%] relative overflow-hidden border-r border-white/6 bg-[#0b0b0b] p-14 flex-col justify-between">
        <div className="space-y-10">
          <div className="flex items-center gap-3">
            <div className="skeleton h-12 w-12 rounded-2xl" />
            <div className="skeleton h-8 w-32" />
          </div>
          <div className="space-y-6">
            <div className="skeleton h-8 w-40 rounded-full" />
            <div className="skeleton h-16 w-full max-w-sm" />
            <div className="skeleton h-24 w-full" />
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-14 w-full max-w-sm rounded-2xl" />
          ))}
        </div>
      </div>

      {/* Right Form Skeleton */}
      <div className="relative flex w-full items-center justify-center bg-[#060606] px-6 py-12 sm:px-8 lg:w-[56%] lg:px-14">
        <div className="relative z-10 w-full max-w-lg space-y-8">
          <div className="skeleton h-10 w-24 rounded-full" />
          
          <div className="space-y-4">
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-6 w-3/4 opacity-60" />
          </div>

          <div className="space-y-6 bg-white/[0.03] border border-white/8 rounded-[2rem] p-8">
            <div className="space-y-4">
              <div className="skeleton h-5 w-20" />
              <div className="skeleton h-14 w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
              <div className="skeleton h-5 w-20" />
              <div className="skeleton h-14 w-full rounded-2xl" />
            </div>
            <div className="skeleton h-14 w-full rounded-2xl opacity-80" />
          </div>

          <div className="flex justify-center pt-4">
            <div className="skeleton h-6 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
