"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type ResponsiveArtboardProps = {
  baseWidth: number;
  baseHeight: number;
  children: ReactNode;
  className?: string;
};

export function ResponsiveArtboard({
  baseWidth,
  baseHeight,
  children,
  className = "",
}: ResponsiveArtboardProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    let frameId = 0;
    const updateScale = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setScale(Math.max(frame.clientWidth / baseWidth, 0.01));
      });
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(frame);
    window.addEventListener("resize", updateScale);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [baseWidth]);

  return (
    <div
      ref={frameRef}
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: `${baseWidth} / ${baseHeight}` }}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: baseWidth,
          height: baseHeight,
          opacity: scale > 0 ? 1 : 0,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        {children}
      </div>
    </div>
  );
}
