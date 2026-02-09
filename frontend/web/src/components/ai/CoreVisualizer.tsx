"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function CoreVisualizer({ isActive = false }: { isActive?: boolean }) {
  const [particles, setParticles] = useState<
    Array<{
      x: number;
      y: number;
      duration: number;
      delay: number;
      targetY: number;
    }>
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 6 }).map((_, i) => ({
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        duration: Math.random() * 2 + 1,
        delay: i * 0.4,
        targetY: Math.random() * 60 + 20,
      })),
    );
  }, []);

  return (
    <div className="relative w-48 h-48 flex items-center justify-center pointer-events-none">
      {/* Outer Glow */}
      <motion.div
        className="absolute inset-0 bg-lumina-primary/10 rounded-full blur-[60px]"
        animate={{
          scale: isActive ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isActive ? [0.3, 0.6, 0.3] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Neural Rings */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute border border-lumina-primary/20 rounded-full"
          initial={{ width: 0, height: 0, opacity: 0 }}
          animate={{
            width: ["0%", "150%"],
            height: ["0%", "150%"],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            delay: i * 2.5,
            ease: "easeOut",
          }}
        />
      ))}

      {/* The Core Orb */}
      <div className="relative w-24 h-24">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-lumina-primary via-blue-400 to-lumina-primary/80 rounded-full shadow-[0_0_50px_rgba(59,130,246,0.5)]"
          animate={{
            scale: isActive ? [1, 1.1, 1] : [1, 1.02, 1],
            rotate: [0, 360],
          }}
          transition={{
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          }}
        />

        {/* Inner Core Detail with Neural Activity */}
        <motion.div
          className="absolute inset-2 bg-black rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden"
          animate={{
            boxShadow: isActive
              ? [
                  "inset 0 0 30px rgba(59,130,246,0.8)",
                  "inset 0 0 50px rgba(59,130,246,0.4)",
                  "inset 0 0 30px rgba(59,130,246,0.8)",
                ]
              : [
                  "inset 0 0 15px rgba(59,130,246,0.4)",
                  "inset 0 0 10px rgba(59,130,246,0.2)",
                  "inset 0 0 15px rgba(59,130,246,0.4)",
                ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {/* Neural Particles */}
          <div className="absolute inset-0">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-lumina-primary rounded-full blur-[1px]"
                initial={{
                  x: p.x,
                  y: p.y,
                  opacity: 0,
                }}
                animate={{
                  y: [null, p.targetY],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                }}
              />
            ))}
          </div>
          <div className="w-full h-full opacity-30 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />
        </motion.div>
      </div>
    </div>
  );
}
