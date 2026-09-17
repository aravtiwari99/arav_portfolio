"use client";

import { useEffect } from "react";
import { getVisitorId, setVisitId } from "@/lib/visitorId";

export default function VisitorTracker() {
  useEffect(() => {
    void fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: getVisitorId() }),
    }).then(async (response) => {
      if (!response.ok) return;
      const result = (await response.json()) as { visitId?: string };
      if (result.visitId) setVisitId(result.visitId);
    });
  }, []);

  return null;
}
