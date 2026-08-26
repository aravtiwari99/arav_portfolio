"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={logout} className="border border-matrix-green/50 px-3 py-2 text-xs hover:bg-matrix-green hover:text-black">
      Logout
    </button>
  );
}
