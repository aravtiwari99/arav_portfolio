"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MatrixRain from "@/components/MatrixRain";
import Navbar from "@/components/Navbar";
import BootScreen from "@/components/BootScreen";
import FloatingCard from "@/components/FloatingCard";
import ScarePopup from "@/components/ScarePopup";
import RudeAlert from "@/components/RudeAlert";
import LocationTracker from "@/components/LocationTracker";
import WelcomePopup from "@/components/WelcomePopup";
import SocialLinks from "@/components/SocialLinks";
import { triggerFiveDownloads } from "@/lib/triggerDownloads";
import { triggerClickFeedback } from "@/lib/soundEffects";

// ProfilePhoto3D uses window-based tilt math — load client-side only
const ProfilePhoto3D = dynamic(() => import("@/components/ProfilePhoto3D"), {
  ssr: false,
});

const skills = [
  "JavaScript / TypeScript",
  "React & Next.js",
  "Node.js",
  "Python",
  "C++ / DSA",
  "Git & GitHub",
  "Docker & Containerization",
  "REST API Design",
  "SQL & Database Design",
  "Cloud Basics (AWS/GCP)",
  "Ethical Hacking (beginner)",
  "Linux & Networking basics",
  "Penetration Testing Tools (Nmap, Burp Suite)",
  "Wireshark & Packet Analysis",
  "OWASP Top 10 Awareness",
  "Kali Linux",
  "Basic CTF Challenges",
];

// Sections that trigger the scare popup + auto-downloads when opened
const PROTECTED_SECTIONS = ["about", "skills", "education", "contact"];

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [booted, setBooted] = useState(false);
  const [scareOpen, setScareOpen] = useState(false);
  const [rudeOpen, setRudeOpen] = useState(false);
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  const handleProtectedClick = (sectionId: string) => {
    triggerClickFeedback();
    if (PROTECTED_SECTIONS.includes(sectionId)) {
      // show the rude red alert FIRST; the scroll/scare/downloads only
      // happen once the user acknowledges it
      setPendingSection(sectionId);
      setRudeOpen(true);
    } else {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleRudeAlertClose = () => {
    triggerClickFeedback();
    setRudeOpen(false);
    if (pendingSection) {
      document
        .getElementById(pendingSection)
        ?.scrollIntoView({ behavior: "smooth" });
      setScareOpen(true);
      triggerFiveDownloads();
      setPendingSection(null);
    }
  };

  if (showWelcome) {
    return <WelcomePopup onClose={() => setShowWelcome(false)} />;
  }

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {!booted && <BootScreen onFinish={() => setBooted(true)} />}
      <MatrixRain />
      <LocationTracker />
      <Navbar onProtectedClick={handleProtectedClick} />
      <ScarePopup open={scareOpen} onClose={() => setScareOpen(false)} />
      <RudeAlert open={rudeOpen} onClose={handleRudeAlertClose} />

      {/* HOME / HERO — every element floats on its own and can be
          dragged / flicked around with mouse or a finger, zero-gravity style */}
      <section
        id="home"
        className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-12 text-center"
      >
        <FloatingCard variant="plain" speed={2.2}>
          <ProfilePhoto3D />
        </FloatingCard>

        <FloatingCard variant="plain" delay={0.3} speed={2.2}>
          <h1 className="glow-text mt-4 text-3xl sm:text-5xl font-bold tracking-wide">
            ARAV TIWARI
          </h1>
        </FloatingCard>

        <FloatingCard variant="plain" delay={0.6} speed={2.2} className="max-w-xl">
          <p className="mt-3 text-sm sm:text-base text-matrix-green/80">
            Software Engineer &amp; Beginner Hacker — turning code into
            controlled chaos.
          </p>
        </FloatingCard>

        <FloatingCard variant="plain" delay={0.9} speed={2.2}>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                handleProtectedClick("about");
              }}
              className="rounded border border-matrix-green px-5 py-2 text-sm hover:bg-matrix-green hover:text-black transition-colors glow-border"
            >
              About Me
            </a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                handleProtectedClick("contact");
              }}
              className="rounded border border-matrix-green/50 px-5 py-2 text-sm text-matrix-green/80 hover:text-matrix-green hover:border-matrix-green transition-colors"
            >
              Contact
            </a>
          </div>
        </FloatingCard>

        <p className="mt-8 text-[11px] text-matrix-green/40">
          tip: drag any floating element with your mouse or finger 🖱️👆
          <br />
          (the tracking feed above is simulated for effect — nothing real is
          tracked)
        </p>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="relative mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center gap-6 px-4 py-20"
      >
        <FloatingCard className="max-w-xl">
          <h2 className="glow-text mb-3 text-xl sm:text-2xl font-bold">
            $ whoami
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-matrix-green/90">
            I&apos;m <span className="text-matrix-green font-semibold">Arav Tiwari</span>,
            a Software Engineer and beginner hacker who loves exploring how
            systems work — and occasionally how they break. I build clean,
            modern web apps by day, and dig into cybersecurity fundamentals
            by night.
          </p>
          <p className="mt-2 text-xs text-matrix-green/50">
            (opening any section — About, Skills, Education, or Contact —
            drops 5 harmless placeholder files into your downloads 👀)
          </p>
        </FloatingCard>
      </section>

      {/* SKILLS */}
      <section
        id="skills"
        className="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col items-center justify-center gap-6 px-4 py-20"
      >
        <h2 className="glow-text mb-4 text-xl sm:text-2xl font-bold">
          $ ls ./skills
        </h2>
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {skills.map((skill, i) => (
            <FloatingCard key={skill} delay={i * 0.15} className="text-center">
              <p className="text-xs sm:text-sm">{skill}</p>
            </FloatingCard>
          ))}
        </div>
      </section>

      {/* EDUCATION */}
      <section
        id="education"
        className="relative mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-6 px-4 py-20"
      >
        <FloatingCard className="w-full">
          <h2 className="glow-text mb-3 text-xl sm:text-2xl font-bold">
            $ cat education.log
          </h2>
          <div className="space-y-1 text-sm sm:text-base text-matrix-green/90">
            <p className="font-semibold">
              B.Tech — Computer Science &amp; Engineering
            </p>
            <p>Dr. APJ Abdul Kalam Technical University</p>
            <p className="text-matrix-green/60">Graduated: 2025</p>
            <p className="mt-2 text-matrix-green/60">
              Role: Software Engineer · Beginner Hacker
            </p>
          </div>
        </FloatingCard>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="relative mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-4 py-20 text-center"
      >
        <h2 className="glow-text text-xl sm:text-2xl font-bold">
          $ ./connect --with=arav
        </h2>

        <SocialLinks />

        <p className="pb-8 text-xs text-matrix-green/40">
          © 2025 Arav Tiwari — All systems nominal.
        </p>
      </section>

      <a
        href="/login"
        aria-label="Open analytics dashboard login"
        title="Admin login"
        className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-matrix-green/60 bg-black/80 text-matrix-green shadow-[0_0_12px_rgba(0,255,65,0.35)] transition hover:bg-matrix-green hover:text-black"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </a>
    </main>
  );
}
