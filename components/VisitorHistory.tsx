"use client";

import { useEffect, useState } from "react";
import type { VisitorRecord } from "@/lib/locationStore";

type DateFilter = "all" | "year" | "month" | "week" | "day";

const FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "All time" },
  { value: "year", label: "Yearly" },
  { value: "month", label: "Monthly" },
  { value: "week", label: "Last week" },
  { value: "day", label: "Last 24 hours" },
];

function isInFilter(visitedAt: string, filter: DateFilter, now: number) {
  const date = new Date(visitedAt);
  if (filter === "all") return true;
  if (filter === "year") return date.getFullYear() === new Date(now).getFullYear();
  if (filter === "month") {
    const current = new Date(now);
    return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
  }

  const age = now - date.getTime();
  return filter === "week" ? age <= 7 * 24 * 60 * 60 * 1000 : age <= 24 * 60 * 60 * 1000;
}

export default function VisitorHistory({ history }: { history: VisitorRecord[] }) {
  const [filter, setFilter] = useState<DateFilter>("all");
  const [now, setNow] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const filteredHistory = history.filter((visit) =>
    isInFilter(visit.visitedAt, filter, now || Date.now()),
  );

  async function deleteSelected() {
    if (!selected.length || !window.confirm("Delete selected visitor records permanently from Supabase?")) return;
    await Promise.all(selected.map((id) => fetch("/api/admin/inbox/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "visitor", id }),
    })));
    setNotice("Selected visitor records deleted from Supabase.");
    setSelected([]);
    window.location.reload();
  }

  function toggleAllVisitors() {
    setSelected((current) => current.length === filteredHistory.length ? [] : filteredHistory.map((visit) => visit.id));
  }

  return (
    <section className="mt-8 border border-matrix-green/40 p-6 glow-border">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold">Visitor history</h2>
          <p className="mt-2 text-sm text-matrix-green/70">
            Total visits: <strong className="text-matrix-green">{history.length}</strong>
          </p>
        </div>
        <label className="text-sm text-matrix-green/80">
          <span className="mr-2">Show</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as DateFilter)}
            className="border border-matrix-green/50 bg-black px-3 py-2 text-matrix-green outline-none focus:border-matrix-green"
          >
            {FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button type="button" disabled={!selected.length} onClick={() => void deleteSelected()} className="mt-4 border border-red-500/60 px-3 py-2 text-xs text-red-300 disabled:opacity-40">Delete selected visitors</button>
      <button type="button" disabled={!filteredHistory.length} onClick={toggleAllVisitors} className="ml-2 mt-4 border border-matrix-green/40 px-3 py-2 text-xs text-matrix-green disabled:opacity-40">{selected.length === filteredHistory.length ? "Clear selection" : "Select all visitors"}</button>
      {notice && <p className="mt-2 text-xs text-yellow-300">{notice}</p>}
      <p className="mt-4 text-sm text-matrix-green/70">
        {filteredHistory.length} visit{filteredHistory.length === 1 ? "" : "s"} in selected period. Location appears only after browser consent.
      </p>
      {filteredHistory.length === 0 ? (
        <p className="mt-4 text-sm text-matrix-green/70">No visits recorded in this period.</p>
      ) : (
        <div className="mt-4 space-y-4">
          {filteredHistory.map((visit) => (
            <article key={visit.id} className="border border-matrix-green/20 p-4 text-sm text-matrix-green/80">
              <label className="mb-3 flex items-center gap-2 text-xs text-matrix-green"><input type="checkbox" checked={selected.includes(visit.id)} onChange={(event) => setSelected((current) => event.target.checked ? [...current, visit.id] : current.filter((id) => id !== visit.id))} /> Select visitor record</label>
              <p>Visited: {new Date(visit.visitedAt).toLocaleString()}</p>
              <p>Public IP: {visit.publicIp || "Unavailable"}</p>
              <p className="break-words">Browser/device: {visit.userAgent || "Unavailable"}</p>
              <p className="text-xs text-matrix-green/60">Physical device/MAC address is not available to web browsers.</p>
              {visit.location ? (
                <>
                  <p className="text-xs text-matrix-green/60">
                    {visit.location.source === "browser" ? "Exact browser location" : "Approximate IP location"}
                  </p>
                  {visit.location.city && (
                    <p>{[visit.location.city, visit.location.region, visit.location.country].filter(Boolean).join(", ")}</p>
                  )}
                  <p>Latitude: {visit.location.latitude.toFixed(6)}</p>
                  <p>Longitude: {visit.location.longitude.toFixed(6)}</p>
                  <p>Accuracy: approximately {Math.round(visit.location.accuracy)} m</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${visit.location.latitude},${visit.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block border border-matrix-green px-4 py-2 text-matrix-green hover:bg-matrix-green hover:text-black"
                  >
                    Open location in Google Maps
                  </a>
                </>
              ) : (
                <p className="mt-1 text-matrix-green/60">Location not shared.</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
