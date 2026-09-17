"use client";

import { useState, type ReactNode } from "react";

type DashboardTab = "visitors" | "messages" | "calls";

interface DashboardTabsProps {
  visitors: ReactNode;
  messages: ReactNode;
  calls: ReactNode;
  profile: ReactNode;
}

export default function DashboardTabs({ visitors, messages, calls, profile }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("visitors");
  const tabs: Array<{ value: DashboardTab; label: string }> = [
    { value: "visitors", label: "Visitors" },
    { value: "messages", label: "Messages" },
    { value: "calls", label: "Call requests" },
  ];

  return (
    <>
      <nav className="w-full border-b border-matrix-green/30 bg-black/90" aria-label="Dashboard sections">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`border px-4 py-2 text-sm transition-colors ${
              activeTab === tab.value
                ? "border-matrix-green bg-matrix-green text-black"
                : "border-matrix-green/40 text-matrix-green hover:border-matrix-green"
            }`}
            aria-current={activeTab === tab.value ? "page" : undefined}
          >
            {tab.label}
          </button>
          ))}
          </div>
          {profile}
        </div>
      </nav>
      <div className="mx-auto max-w-3xl px-4">
        <div className={activeTab === "visitors" ? "block" : "hidden"}>{visitors}</div>
        <div className={activeTab === "messages" ? "block" : "hidden"}>{messages}</div>
        <div className={activeTab === "calls" ? "block" : "hidden"}>{calls}</div>
      </div>
    </>
  );
}