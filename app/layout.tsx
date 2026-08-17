import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arav Tiwari | Hacker Portfolio",
  description:
    "Arav Tiwari — Software Engineer & Beginner Hacker. B.Tech CSE, Dr APJ Abdul Kalam Technical University (2025).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-mono bg-black text-matrix-green antialiased">
        {children}
        <div className="scanlines" />
      </body>
    </html>
  );
}
