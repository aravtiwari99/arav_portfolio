"use client";

interface NavbarProps {
  onProtectedClick: (sectionId: string) => void;
}

const links = [
  { label: "Home", href: "#home", protected: false },
  { label: "About", href: "#about", protected: true },
  { label: "Skills", href: "#skills", protected: true },
  { label: "Education", href: "#education", protected: true },
  { label: "Contact", href: "#contact", protected: true },
];

export default function Navbar({ onProtectedClick }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex flex-wrap items-center justify-between gap-2 border-b border-matrix-green/30 bg-black/70 px-3 py-2 backdrop-blur-md sm:flex-nowrap sm:px-8 sm:py-3">
      <span className="glow-text shrink-0 font-bold tracking-widest text-xs sm:text-base">
        &lt;ARAV_TIWARI /&gt;
      </span>
      <div className="flex min-w-0 flex-wrap justify-end gap-x-2 gap-y-1 text-[10px] sm:gap-6 sm:text-sm">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            onClick={(e) => {
              if (link.protected) {
                e.preventDefault();
                onProtectedClick(link.href.replace("#", ""));
              }
            }}
            className="text-matrix-green/80 hover:text-matrix-green hover:glow-text transition-all"
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
