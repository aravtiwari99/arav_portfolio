"use client";

import { useEffect } from "react";

export default function ScreenProtection() {
  useEffect(() => {
    const block = (event: Event) => event.preventDefault();
    const handleVisibility = () => {
      document.documentElement.classList.toggle("screen-hidden", document.visibilityState !== "visible");
    };

    document.addEventListener("contextmenu", block);
    document.addEventListener("selectstart", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeprint", block);

    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("selectstart", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeprint", block);
    };
  }, []);

  return null;
}
