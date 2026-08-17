"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ScarePopupProps {
  open: boolean;
  onClose: () => void;
}

const MESSAGES = [
  "SYSTEM BREACH DETECTED",
  "UNAUTHORIZED ACCESS LOGGED",
  "YOUR IP HAS BEEN RECORDED",
  "WEBCAM ACCESS: GRANTED",
  "TRACE COMPLETE...",
];

export default function ScarePopup({ open, onClose }: ScarePopupProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && boxRef.current) {
      gsap.fromTo(
        boxRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.25, ease: "back.out(3)" }
      );
      gsap.to(boxRef.current, {
        x: "+=6",
        duration: 0.06,
        repeat: 8,
        yoyo: true,
        delay: 0.2,
      });
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-[90%] max-w-md rounded-lg border-2 border-matrix-red bg-black p-6 text-center shadow-[0_0_40px_rgba(255,0,51,0.6)]"
      >
        <p
          className="glitch-text text-xl sm:text-2xl font-bold text-matrix-red animate-glitch"
          data-text="⚠ WARNING ⚠"
        >
          ⚠ WARNING ⚠
        </p>
        <div className="mt-4 space-y-1 text-sm sm:text-base text-matrix-green/90">
          {MESSAGES.map((m) => (
            <p key={m} className="animate-flicker">
              {m}
            </p>
          ))}
        </div>
        <p className="mt-4 text-xs text-matrix-green/50">
          (relax, it&apos;s just a portfolio 😄 — click anywhere to close)
        </p>
        <button
          onClick={onClose}
          className="mt-4 rounded border border-matrix-red px-4 py-1.5 text-sm text-matrix-red hover:bg-matrix-red hover:text-black transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
