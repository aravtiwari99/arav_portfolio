"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen animated "hacking code" rain, rendered on a 2D canvas
 * but styled with a CSS 3D perspective tilt so it feels like it is
 * running behind/below the content in 3D space.
 */
export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight * 1.4);

    const glyphs =
      "アイウエオカキクケコサシスセソ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ$#@%&{}[]<>/\\";

    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = new Array(columns).fill(1);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight * 1.4;
      columns = Math.floor(width / fontSize);
      drops = new Array(columns).fill(1);
    };
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = glyphs[Math.floor(Math.random() * glyphs.length)];
        const isHead = Math.random() > 0.93;
        ctx.fillStyle = isHead ? "#c8ffd4" : "#00ff41";
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden bg-black"
      style={{ perspective: "600px" }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-70"
        style={{
          transform: "rotateX(25deg) scale(1.25)",
          transformOrigin: "top center",
        }}
      />
      {/* dark vignette so foreground text stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
    </div>
  );
}
