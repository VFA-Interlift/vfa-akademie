"use client";

import type { CSSProperties, ReactNode } from "react";

type AnimatedSectionProps = {
  children: ReactNode;
  delayMs?: number;
  style?: CSSProperties;
};

export default function AnimatedSection({
  children,
  delayMs = 0,
  style,
}: AnimatedSectionProps) {
  return (
    <div
      style={{
        animationName: "vfaFadeUp",
        animationDuration: "520ms",
        animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        animationFillMode: "both",
        animationDelay: `${delayMs}ms`,
        ...style,
      }}
    >
      {children}

      <style jsx>{`
        @keyframes vfaFadeUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}