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
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between border-b border-matrix-green/30 bg-black/70 backdrop-blur-md px-4 sm:px-8 py-3">
      <span className="glow-text font-bold tracking-widest text-sm sm:text-base">
        &lt;ARAV_TIWARI /&gt;
      </span>
      <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm">
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
