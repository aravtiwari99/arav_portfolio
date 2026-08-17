"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Purely cosmetic fake "location tracking" terminal feed.
 * It does NOT request the browser's real Geolocation API or send any
 * data anywhere — every IP/lat/long/city value below is randomly
 * generated client-side, just for the spooky hacker-movie effect.
 */

type LineType = "gps" | "trace" | "net" | "scan" | "ok" | "warn";

interface Line {
  id: number;
  type: LineType;
  text: string;
}

const COLOR: Record<LineType, string> = {
  gps: "text-cyan-400",
  trace: "text-fuchsia-400",
  net: "text-yellow-300",
  scan: "text-matrix-green",
  ok: "text-emerald-400",
  warn: "text-red-500",
};

const CITIES = [
  "New Delhi, IN",
  "Mumbai, IN",
  "Lucknow, IN",
  "Bengaluru, IN",
  "Unknown Location",
  "Frankfurt, DE",
  "Singapore, SG",
  "Ashburn, US",
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function fakeIp() {
  return `${randInt(10, 250)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(
    1,
    254
  )}`;
}

function fakeCoord() {
  const lat = (Math.random() * 180 - 90).toFixed(4);
  const lng = (Math.random() * 360 - 180).toFixed(4);
  return `${lat}, ${lng}`;
}

function generateLine(id: number): Line {
  const roll = Math.random();
  if (roll < 0.18) {
    return { id, type: "gps", text: `[GPS] acquiring satellite lock... ${randInt(10, 99)}%` };
  }
  if (roll < 0.34) {
    return { id, type: "gps", text: `[GPS] coordinates locked: ${fakeCoord()}` };
  }
  if (roll < 0.5) {
    return { id, type: "trace", text: `[TRACE] resolving ip ${fakeIp()}...` };
  }
  if (roll < 0.62) {
    return { id, type: "net", text: `[NET] pinging node... ${randInt(8, 240)}ms` };
  }
  if (roll < 0.76) {
    return { id, type: "scan", text: `[SCAN] nearby device found: DEV-${randInt(1000, 9999)}` };
  }
  if (roll < 0.9) {
    return {
      id,
      type: "ok",
      text: `[LOCATION] target city: ${CITIES[randInt(0, CITIES.length - 1)]}`,
    };
  }
  return { id, type: "warn", text: `[WARN] connection unstable, retrying...` };
}

export default function LocationTracker() {
  const [lines, setLines] = useState<Line[]>([]);
  const counter = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      counter.current += 1;
      setLines((prev) => {
        const next = [...prev, generateLine(counter.current)];
        return next.slice(-40); // keep enough lines to fill a full screen
      });
    }, 260);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight });
  }, [lines]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 w-screen h-screen select-none overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        className="h-full w-full overflow-hidden px-4 sm:px-10 py-6 font-mono text-[10px] sm:text-xs leading-relaxed opacity-30 sm:opacity-35"
      >
        <p className="mb-1 text-matrix-green/40">
          root@tracker:~$ ./locate_target.sh --live
        </p>
        {lines.map((line) => (
          <p key={line.id} className={`${COLOR[line.type]}`}>
            {line.text}
          </p>
        ))}
      </div>
      {/* subtle vignette so hero content in the center stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/10" />
    </div>
  );
}
