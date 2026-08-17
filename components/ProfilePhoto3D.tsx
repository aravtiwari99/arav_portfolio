"use client";

import { useRef } from "react";
import Image from "next/image";

/**
 * Displays the profile photo in a glowing frame with a live 3D tilt
 * that follows the mouse (or finger on touch) — gives the flat image
 * a sense of depth without needing a 3D model.
 */
export default function ProfilePhoto3D() {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const handleMove = (clientX: number, clientY: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width - 0.5;
    const py = (clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(700px) rotateY(${px * 18}deg) rotateX(${
      -py * 18
    }deg)`;
  };

  const reset = () => {
    if (wrapRef.current) {
      wrapRef.current.style.transform =
        "perspective(700px) rotateY(0deg) rotateX(0deg)";
    }
  };

  return (
    <div
      className="flex items-center justify-center"
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseLeave={reset}
      onTouchMove={(e) => {
        const t = e.touches[0];
        if (t) handleMove(t.clientX, t.clientY);
      }}
      onTouchEnd={reset}
    >
      <div
        ref={wrapRef}
        className="relative h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80 overflow-hidden rounded-full border-2 border-matrix-green glow-border transition-transform duration-150 ease-out will-change-transform"
        style={{ transform: "perspective(700px) rotateY(0deg) rotateX(0deg)" }}
      >
        <Image
          src="/profile.jpg"
          alt="Arav Tiwari"
          fill
          sizes="(max-width: 640px) 224px, (max-width: 768px) 288px, 320px"
          className="object-cover"
          priority
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-matrix-green/10 via-transparent to-matrix-green/5" />
      </div>
    </div>
  );
}
