"use client";

import { useRouter } from "next/navigation";

export default function GlobalBackButton() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="fixed left-3 top-16 z-[240] flex h-9 w-9 items-center justify-center rounded-full border border-matrix-green/50 bg-black/80 text-lg text-matrix-green shadow-[0_0_12px_rgba(0,255,120,0.25)] hover:bg-matrix-green hover:text-black"
      aria-label="Go back"
      title="Back"
    >
      ←
    </button>
  );
}
