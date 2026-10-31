import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Draftly — Modern Document Workspace",
  description:
    "A modern, focused, distraction-free document workspace and knowledge engine.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-ivory text-charcoal">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-borderTone bg-warmStone-light/40 py-8 text-center text-xs text-mutedText">
            <div className="max-w-6xl mx-auto px-4">
              <p className="font-serif font-bold text-forest text-sm mb-1">
                Draftly Workspace Core
              </p>
              <p>Document Creation, Collaborative Editing &amp; Sharing Platform • Next.js • FastAPI • Supabase PostgreSQL</p>
              <p className="mt-2 text-[11px] font-mono text-mutedText/80">
                Secure Architecture • Cloud Document Persistence • Role-Based Access Control
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
