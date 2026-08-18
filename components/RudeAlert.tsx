"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { startContinuousAlertFeedback, stopContinuousAlertFeedback, triggerClickFeedback } from "@/lib/soundEffects";

interface RudeAlertProps {
  open: boolean;
  onClose: () => void;
}

export default function RudeAlert({ open, onClose }: RudeAlertProps) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && boxRef.current) {
      // Start continuous beep + vibration when alert opens
      startContinuousAlertFeedback();
      
      gsap.fromTo(
        boxRef.current,
        { scale: 0.7, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.2, ease: "back.out(3)" }
      );
      gsap.to(boxRef.current, {
        x: "+=5",
        duration: 0.05,
        repeat: 10,
        yoyo: true,
        delay: 0.15,
      });
    } else {
      // Stop continuous beep + vibration when alert closes
      stopContinuousAlertFeedback();
    }
  }, [open]);

  const handleClose = () => {
    triggerClickFeedback();
    stopContinuousAlertFeedback();
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center bg-black/85 px-4"
      onClick={handleClose}
    >
      <div
        ref={boxRef}
        onClick={(e) => e.stopPropagation()}
        className="w-[92%] max-w-md rounded-lg border-2 border-matrix-red bg-black p-6 text-center shadow-[0_0_40px_rgba(255,0,51,0.7)]"
      >
        <p className="text-xl sm:text-2xl font-bold text-matrix-red animate-flicker">
          ⚠ ALERT ⚠
        </p>
        <p className="mt-4 text-base sm:text-lg font-semibold text-matrix-red leading-snug">
          पहले अपना देख ले BSDK, दूसरे का देखने आया है!
        </p>
        <p className="mt-2 text-sm sm:text-base text-matrix-red/90 leading-snug">
          Sort yourself out first, you asshole — you&apos;ve come to look at
          others..!!
        </p>
        <button
          onClick={handleClose}
          className="mt-6 rounded border border-matrix-red px-6 py-2 text-sm text-matrix-red hover:bg-matrix-red hover:text-black transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
