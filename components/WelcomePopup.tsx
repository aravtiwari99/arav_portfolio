"use client";

import { useEffect } from "react";
import FloatingCard from "@/components/FloatingCard";
import { playPopupSound } from "@/lib/soundEffects";
import { getVisitId, getVisitorId } from "@/lib/visitorId";

interface WelcomePopupProps {
  onClose: () => void;
}

export default function WelcomePopup({ onClose }: WelcomePopupProps) {
  useEffect(() => {
    // Play sound when welcome popup mounts
    playPopupSound();
  }, []);

  function saveApproximateLocation() {
    const visitId = getVisitId();
    void fetch("/api/location/ip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitId, visitorId: getVisitorId() }),
    });
  }

  function handleAccept() {
    onClose();
    if (!navigator.geolocation) {
      saveApproximateLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const visitId = getVisitId();
        void fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            visitId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            source: "browser",
          }),
        });
      },
      saveApproximateLocation,
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black px-4">
      <FloatingCard variant="plain" speed={3.2}>
        <div className="w-[88vw] max-w-sm rounded-xl border-2 border-matrix-green bg-black/90 px-6 py-8 text-center glow-border">
          <p className="glow-text text-2xl sm:text-3xl font-bold">
            हर हर महादेव
          </p>
          <p className="mt-2 text-sm sm:text-base tracking-wide text-matrix-green/80">
            har har mahadev
          </p>
          <p className="mt-4 text-xs text-matrix-green/60">
            Press OK to continue.
          </p>
          <button
            onClick={handleAccept}
            className="mt-6 rounded border border-matrix-green px-8 py-2 text-sm hover:bg-matrix-green hover:text-black transition-colors"
          >
            OK
          </button>
        </div>
      </FloatingCard>
    </div>
  );
}
