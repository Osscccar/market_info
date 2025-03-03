"use client";
import { useEffect } from "react";

// Declare a global interface for window.adsbygoogle
declare global {
  interface Window {
    adsbygoogle?: { push?: (args: unknown) => void }[];
  }
}

// Define an interface for the component's props
interface GoogleAdProps {
  slotId: string;
}

export default function GoogleAd({ slotId }: GoogleAdProps) {
  useEffect(() => {
    if (typeof window !== "undefined" && window.adsbygoogle) {
      try {
        window.adsbygoogle.push({});
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-3897454319931596"
      data-ad-slot={slotId} // Now using the slotId prop
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
