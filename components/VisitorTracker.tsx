"use client";

import { useEffect } from "react";
import { getVisitorId } from "@/lib/visitorId";

export default function VisitorTracker() {
  useEffect(() => {
    void fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    });
  }, []);

  return null;
}
