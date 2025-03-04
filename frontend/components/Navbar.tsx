"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-black border-b border-gray-800/50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left brand */}
        <span className="text-xl font-bold">US Stock Info</span>

        {/* Mobile Menu Button (Top Right) */}
        <button
          className="md:hidden text-muted-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
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

      {/* Mobile Navigation Drawer (Slides in from Right) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-75 z-50 transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="absolute top-0 right-0 w-64 bg-black h-full shadow-lg p-6">
          <button
            className="absolute top-4 right-4 text-muted-foreground"
            onClick={() => setIsOpen(false)}
          >
            <X size={24} />
          </button>
          <nav className="flex flex-col space-y-4 mt-10 text-sm">
            <Link
              href="/"
              className="hover:text-white text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/legal"
              className="hover:text-white text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Legal
            </Link>
            <Link
              href="/articles"
              className="hover:text-white text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Articles
            </Link>
            <Link
              href="/support"
              className="hover:text-white text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Support
            </Link>
            <Link
              href="/feedback"
              className="hover:text-white text-muted-foreground"
              onClick={() => setIsOpen(false)}
            >
              Feedback
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
