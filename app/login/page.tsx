"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const result = await response.json();
      setError(result.error || "Login failed.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm border border-matrix-green/50 bg-black/90 p-6 glow-border">
        <p className="mb-2 text-xs text-matrix-green/60">ARAV SYSTEMS / ADMIN</p>
        <h1 className="glow-text mb-6 text-2xl font-bold">Admin Login</h1>
        <label className="mb-4 block text-sm">
          Username
          <input required value={username} onChange={(event) => setUsername(event.target.value)} className="mt-2 w-full border border-matrix-green/40 bg-black px-3 py-2 text-matrix-green outline-none focus:border-matrix-green" autoComplete="username" />
        </label>
        <label className="mb-4 block text-sm">
          Password
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full border border-matrix-green/40 bg-black px-3 py-2 text-matrix-green outline-none focus:border-matrix-green" autoComplete="current-password" />
        </label>
        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
        <button disabled={loading} className="w-full border border-matrix-green px-4 py-2 text-sm transition hover:bg-matrix-green hover:text-black disabled:opacity-50">
          {loading ? "Checking..." : "Login"}
        </button>
        <a href="/" className="mt-5 block text-center text-xs text-matrix-green/60 hover:text-matrix-green">Back to portfolio</a>
      </form>
    </main>
  );
}
