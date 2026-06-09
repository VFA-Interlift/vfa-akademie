"use client";

import { useEffect, useState } from "react";

type AnimatedProgressCircleProps = {
  percent: number;
  credits: number;
  color: string;
};

const ANIMATION_DURATION_MS = 1200;

export default function AnimatedProgressCircle({
  percent,
  credits,
  color,
}: AnimatedProgressCircleProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  useEffect(() => {
    let animationFrameId = 0;
    let startTime: number | null = null;

    function animate(timestamp: number) {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const rawProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const easedProgress = easeOutCubic(rawProgress);
      const nextPercent = Math.round(percent * easedProgress);

      setAnimatedPercent(nextPercent);

      if (rawProgress < 1) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    }

    setAnimatedPercent(0);
    animationFrameId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [percent]);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        paddingTop: 4,
        paddingBottom: 4,
      }}
    >
      <div
        style={{
          width: 230,
          height: 230,
          borderRadius: "50%",
          background: `conic-gradient(${color} ${animatedPercent}%, #E7E7E7 ${animatedPercent}% 100%)`,
          display: "grid",
          placeItems: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            width: 170,
            height: 170,
            borderRadius: "50%",
            background: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 16,
            boxSizing: "border-box",
            boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              color: "#666666",
              fontSize: 12,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Fortschritt
          </div>

          <div
            style={{
              marginTop: 6,
              color,
              fontSize: 42,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            {animatedPercent}%
          </div>

          <div
            style={{
              marginTop: 8,
              color: "#1F1F1F",
              fontSize: 15,
              fontWeight: 800,
              lineHeight: 1.3,
            }}
          >
            {credits.toLocaleString("de-DE")} Credits
          </div>
        </div>
      </div>
    </div>
  );
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}