import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Draftly — Modern Document Workspace",
  description:
    "A modern, focused, distraction-free document workspace and collaboration platform.",
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-paper text-ink font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t-2 border-ink-border bg-paper-cream py-8 text-center text-xs text-ink-muted">
            <div className="max-w-6xl mx-auto px-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-sm bg-coral border-2 border-ink-border flex items-center justify-center text-white font-bold text-xs shadow-retro">
                  D
                </div>
                <span className="font-bold text-ink text-sm tracking-tight">
                  Draftly
                </span>
              </div>
              <p className="font-semibold text-ink text-xs">
                Document Creation, Collaborative Editing &amp; Sharing Platform
              </p>
              <p className="mt-1 text-[11px] text-ink-muted">
                Crafted for focused writing and seamless team collaboration.
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
