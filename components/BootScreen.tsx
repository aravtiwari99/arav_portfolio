"use client";

import { useEffect, useState } from "react";

interface BootScreenProps {
  onFinish: () => void;
}

const LINES = [
  "booting kernel...",
  "mounting /dev/portfolio...",
  "loading identity: ARAV_TIWARI",
  "decrypting profile.dat [OK]",
  "initializing 3D render engine...",
  "access granted.",
];

export default function BootScreen({ onFinish }: BootScreenProps) {
  const [visible, setVisible] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisible(LINES.slice(0, i));
      if (i >= LINES.length) {
        clearInterval(interval);
        setTimeout(() => {
          setDone(true);
          setTimeout(onFinish, 500);
        }, 500);
      }
    }, 350);
    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center bg-black transition-opacity duration-500 ${
        done ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="w-full max-w-lg px-6 text-left text-sm sm:text-base text-matrix-green">
        {visible.map((line, idx) => (
          <p key={idx} className="mb-1">
            <span className="text-matrix-dim">$</span> {line}
          </p>
        ))}
        <p className="terminal-cursor text-matrix-green">&nbsp;</p>
      </div>
    </div>
  );
}
