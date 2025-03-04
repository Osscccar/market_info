import type React from "react";
import type { Metadata } from "next";
import { David_Libre, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stock Info",
  description: "Get detailed information about US stocks",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex text-xs w-full align-center justify-center pt-2 pb-2 bg-white text-black md:text-sm">
          Website is still under develpoment and changes are frequently being
          made.
        </div>
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
