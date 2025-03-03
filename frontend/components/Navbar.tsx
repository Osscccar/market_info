"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-gray-800/50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left brand */}
        <div className="flex items-center space-x-2">
          <Menu className="text-muted-foreground" size={20} />
          <span className="text-xl font-bold">US Stock Info</span>
        </div>

        {/* Right nav links */}
        <div className="flex items-center space-x-6 text-sm">
          <Link href="/" className="hover:text-white text-muted-foreground">
            Home
          </Link>
          <Link
            href="/legal"
            className="hover:text-white text-muted-foreground"
          >
            Legal
          </Link>
          <Link
            href="/articles"
            className="hover:text-white text-muted-foreground"
          >
            Articles
          </Link>
          <Link
            href="/support"
            className="hover:text-white text-muted-foreground"
          >
            Support
          </Link>
          <Link
            href="/feedback"
            className="hover:text-white text-muted-foreground"
          >
            Feedback
          </Link>
        </div>
      </nav>
    </header>
  );
}
