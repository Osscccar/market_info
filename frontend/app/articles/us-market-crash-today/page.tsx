import Image from "next/image";
import { CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Page() {
  const article = {
    title: "US Market Crashes, Billions Lost in a Single Day",
    author: "Alice Thompson",
    date: "2025-03-16",
    image: "/placeholder.svg?height=400&width=800",
    content: `
      <p>The US stock market took a massive hit today, with major indexes plunging by over 5% in just a few hours. 
      Investors watched in disbelief as billions of dollars in market value vanished, raising concerns of a broader economic downturn.</p>

      <p>Analysts point to several factors driving the sell-off, including unexpected economic data, global geopolitical tensions, 
      and mounting investor anxiety. While some experts believe the market could recover quickly, others warn that ongoing volatility 
      could persist for weeks.</p>

      <h2>What This Means for Investors</h2>

      <p>In times of extreme market turbulence, it's crucial for investors to remain calm and focus on their long-term goals. 
      Market crashes can sometimes present opportunities for those willing to weather the storm and buy quality stocks at lower prices. 
      However, caution is advised as further dips could be on the horizon.</p>

      <p>Stay tuned for more updates as the situation develops.</p>
    `,
  };

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {article.title}
          </h1>

          <div className="flex items-center text-gray-400 mb-6">
            <span className="mr-4">{article.author}</span>
            <CalendarDays className="w-4 h-4 mr-2" />
            <time dateTime={article.date}>
              {new Date(article.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          </div>

          <div className="mb-8 rounded-lg overflow-hidden">
            <Image
              src={article.image}
              alt="Article featured image"
              width={800}
              height={400}
              className="w-full h-auto"
            />
          </div>

          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </main>
    </div>
  );
}
