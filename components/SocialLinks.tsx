"use client";

import FloatingCard from "@/components/FloatingCard";

/**
 * NOTE on WhatsApp: WhatsApp's click-to-chat links only work with a full
 * phone number (wa.me/<countrycode><number>), it has no username-based
 * URL like Instagram/Telegram/Snapchat do. Replace WHATSAPP_NUMBER below
 * with your real number (with country code, no + or spaces) to make the
 * WhatsApp icon open a real chat.
 */
const WHATSAPP_NUMBER = "91XXXXXXXXXX"; // <-- replace with your real number

const SOCIALS = [
  {
    name: "Instagram",
    href: "https://instagram.com/the_aravtiwari",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    name: "WhatsApp",
    href: `https://wa.me/${WHATSAPP_NUMBER}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20l1.3-3.9A8 8 0 1 1 8.9 19L4 20Z" />
        <path d="M9 10c0 3 2 5 5 5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Telegram",
    href: "https://t.me/the_aravtiwari",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M21 4L3 11l6 2m12-9l-4 16-6-6m10-10L9 13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    name: "Snapchat",
    href: "https://www.snapchat.com/add/the_aravtiwari",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path
          d="M12 3c3 0 4.5 2.2 4.5 5v2.2c0 .5.4 1 1 1.3.6.3 1.5.3 1.5 1 0 .6-.9 1-1.6 1.3-.4.2-.6.5-.5.9.2.7.9 1.3 1.9 1.4-.1.6-1 .9-1.8 1-.4 0-.6.2-.7.5-.2.5-.4 1-1.7 1-1 0-1.4.7-2.6.7s-1.6-.7-2.6-.7c-1.3 0-1.5-.5-1.7-1-.1-.3-.3-.5-.7-.5-.8-.1-1.7-.4-1.8-1 1-.1 1.7-.7 1.9-1.4.1-.4-.1-.7-.5-.9-.7-.3-1.6-.7-1.6-1.3 0-.7.9-.7 1.5-1 .6-.3 1-.8 1-1.3V8c0-2.8 1.5-5 4.5-5Z"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function SocialLinks() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
      {SOCIALS.map((s, i) => (
        <FloatingCard key={s.name} delay={i * 0.2} speed={1.8} className="w-20">
          <a
            href={s.href}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col items-center gap-1.5 text-matrix-green/80 hover:text-matrix-green transition-colors"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-matrix-green/40 glow-border">
              <span className="h-5 w-5">{s.icon}</span>
            </span>
            <span className="text-[10px] leading-tight">the_aravtiwari</span>
          </a>
        </FloatingCard>
      ))}
    </div>
  );
}
