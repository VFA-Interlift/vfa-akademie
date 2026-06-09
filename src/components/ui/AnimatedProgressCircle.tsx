"use client";

import { useEffect, useMemo, useState } from "react";

type AnimatedProgressCircleProps = {
  percent: number;
  credits: number;
  color: string;
};

const SIZE = 230;
const STROKE_WIDTH = 18;
const ANIMATION_DURATION_MS = 1400;

export default function AnimatedProgressCircle({
  percent,
  credits,
  color,
}: AnimatedProgressCircleProps) {
  const [animatedPercent, setAnimatedPercent] = useState(0);

  const circle = useMemo(() => {
    const radius = (SIZE - STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;

    return {
      radius,
      circumference,
      center: SIZE / 2,
    };
  }, []);

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

  const strokeOffset =
    circle.circumference -
    (circle.circumference * Math.min(animatedPercent, 100)) / 100;

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
          width: SIZE,
          height: SIZE,
          position: "relative",
          display: "grid",
          placeItems: "center",
        }}
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx={circle.center}
            cy={circle.center}
            r={circle.radius}
            fill="none"
            stroke="#E7E7E7"
            strokeWidth={STROKE_WIDTH}
          />

          <circle
            cx={circle.center}
            cy={circle.center}
            r={circle.radius}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circle.circumference}
            strokeDashoffset={strokeOffset}
          />
        </svg>

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
            position: "relative",
            zIndex: 1,
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