import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "GolfCharity | Play. Win. Give.",
  description: "Join the elite golf charity platform. Submit scores, win prizes, and support your favorite causes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} dark`}>
      <body className="bg-background text-foreground font-sans min-h-screen flex flex-col">
        {/* Navigation */}
        <Navbar />

        {/* Main Content */}
        <main className="flex-grow pt-24">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-20 py-12 px-6">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <h3 className="text-xl font-bold outfit gradient-text">GolfCharity</h3>
              <p className="text-sm text-secondary">
                The premier platform for golfers to make a difference while playing the game they love.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li><Link href="/subscribe">Subscriptions</Link></li>
                <li><Link href="/membership">Membership Benefits</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li><Link href="/charities">Our Partners</Link></li>
                <li><Link href="/success-stories">Impact Stories</Link></li>
                <li><Link href="/blog">Golf Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-secondary">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/rules">Draw Rules</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border text-center text-xs text-secondary">
            © {new Date().getFullYear()} GolfCharity. All rights reserved. Registered Charity Partner.
          </div>
        </footer>
      </body>
    </html>
  );
}
