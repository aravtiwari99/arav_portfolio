"use client";

import { FormEvent, useState } from "react";

export default function ChangePasswordForm({ compact = false }: { compact?: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    const response = await fetch("/api/admin/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Password change failed.");
      return;
    }

    setCurrentPassword("");
    setNewPassword("");
    setMessage("Password changed successfully.");
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "mt-3 border-t border-matrix-green/20 pt-3" : "mt-8 border border-matrix-green/40 p-6 glow-border"}>
      {!compact && <h2 className="mb-3 text-lg font-bold">Change admin password</h2>}
      <input
        required
        minLength={12}
        type="password"
        placeholder="Current password"
        value={currentPassword}
        onChange={(event) => setCurrentPassword(event.target.value)}
        className="mb-3 w-full border border-matrix-green/40 bg-black px-3 py-2 text-matrix-green outline-none focus:border-matrix-green"
        autoComplete="current-password"
      />
      <input
        required
        minLength={12}
        type="password"
        placeholder="New password (12+ characters)"
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
        className="w-full border border-matrix-green/40 bg-black px-3 py-2 text-matrix-green outline-none focus:border-matrix-green"
        autoComplete="new-password"
      />
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-400">{message}</p>}
      <button className="mt-4 border border-matrix-green px-4 py-2 text-sm hover:bg-matrix-green hover:text-black">
        Change password
      </button>
    </form>
  );
}
