"use client";

import { useRef, useState } from "react";
import { gsap } from "gsap";

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** "card" = bordered glowing panel (default). "plain" = no card chrome, just floats/drags — for hero text/buttons. */
  variant?: "card" | "plain";
  /** Multiplier for float speed. 1 = default, 2 = twice as fast, etc. */
  speed?: number;
}

/**
 * Zero-gravity style element: drifts slowly on its own forever (GSAP),
 * and can be picked up and flung around with mouse OR a finger on
 * touch screens (Pointer Events cover both). On release it keeps
 * drifting with the fling velocity before settling back into its
 * gentle idle float — like an object floating free in zero gravity.
 */
export default function FloatingCard({
  children,
  className = "",
  delay = 0,
  variant = "card",
  speed = 1.5,
}: FloatingCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0 });
  const lastPoint = useRef({ x: 0, y: 0, t: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const floatTweenRef = useRef<gsap.core.Timeline | null>(null);

  const startFloat = () => {
    if (!cardRef.current) return;
    const tl = gsap.timeline({ repeat: -1, yoyo: true, delay });
    tl.to(cardRef.current, {
      y: "+=16",
      x: "+=8",
      rotation: 1.5,
      duration: (2.2 + Math.random() * 1.2) / speed,
      ease: "sine.inOut",
    });
    floatTweenRef.current = tl;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!cardRef.current) return;
    setDragging(true);
    floatTweenRef.current?.pause();
    gsap.killTweensOf(cardRef.current);
    dragOffset.current = {
      x: e.clientX - pos.current.x,
      y: e.clientY - pos.current.y,
    };
    lastPoint.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velocity.current = { x: 0, y: 0 };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !cardRef.current) return;
    const x = e.clientX - dragOffset.current.x;
    const y = e.clientY - dragOffset.current.y;
    pos.current = { x, y };
    gsap.set(cardRef.current, { x, y });

    const now = performance.now();
    const dt = Math.max(now - lastPoint.current.t, 1);
    velocity.current = {
      x: ((e.clientX - lastPoint.current.x) / dt) * 16,
      y: ((e.clientY - lastPoint.current.y) / dt) * 16,
    };
    lastPoint.current = { x: e.clientX, y: e.clientY, t: now };
  };

  const onPointerUp = () => {
    if (!cardRef.current) return;
    setDragging(false);

    // fling: keep drifting with release velocity, then settle into idle float
    const throwX = pos.current.x + velocity.current.x * 10;
    const throwY = pos.current.y + velocity.current.y * 10;

    gsap.to(cardRef.current, {
      x: throwX,
      y: throwY,
      duration: 0.9,
      ease: "power3.out",
      onUpdate: () => {
        pos.current = {
          x: Number(gsap.getProperty(cardRef.current, "x")),
          y: Number(gsap.getProperty(cardRef.current, "y")),
        };
      },
      onComplete: () => {
        floatTweenRef.current?.restart();
      },
    });
  };

  const cardChrome =
    variant === "card"
      ? "rounded-xl border border-matrix-green/40 bg-black/60 backdrop-blur-sm glow-border p-5 sm:p-6"
      : "";

  return (
    <div
      ref={(el) => {
        cardRef.current = el;
        if (el && !floatTweenRef.current) startFloat();
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={`cursor-grab active:cursor-grabbing select-none transition-transform will-change-transform ${cardChrome} ${className}`}
      style={{ touchAction: "none" }}
    >
      {children}
    </div>
  );
}
