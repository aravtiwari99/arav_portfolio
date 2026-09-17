"use client";

import { useState } from "react";
import ChangePasswordForm from "@/components/ChangePasswordForm";
import LogoutButton from "@/components/LogoutButton";

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-matrix-green/60 text-lg text-matrix-green hover:bg-matrix-green hover:text-black"
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        ◉
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-20 w-64 border border-matrix-green/50 bg-black p-3 shadow-[0_0_24px_rgba(0,255,120,0.2)]">
          <p className="border-b border-matrix-green/20 pb-2 text-xs text-matrix-green/60">Admin profile</p>
          <button type="button" onClick={() => setPasswordOpen((value) => !value)} className="mt-2 w-full border border-matrix-green/30 px-3 py-2 text-left text-xs text-matrix-green hover:bg-matrix-green hover:text-black">
            Change password
          </button>
          {passwordOpen && <ChangePasswordForm compact />}
          <div className="mt-2 border-t border-matrix-green/20 pt-2"><LogoutButton /></div>
        </div>
      )}
    </div>
  );
}