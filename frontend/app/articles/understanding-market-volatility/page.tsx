import Image from "next/image";
import { CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Page() {
  const article = {
    title: "Understanding Market Volatility: A Beginner's Guide",
    author: "Market Analyst Admin",
    date: "2025-03-15",
    image: "/placeholder.svg?height=400&width=800",
    content: `
      <p>Market volatility is a term that often strikes fear into the hearts of investors, especially those new to the stock market. 
      However, understanding what volatility is and how it affects the market can help you make more informed investment decisions.</p>

      <h2>What is Market Volatility?</h2>
      <p>Market volatility refers to the rate at which the price of a security increases or decreases for a set of returns. 
      It shows the range to which the price of a security may increase or decrease over a period of time.</p>

      <h2>Causes of Market Volatility</h2>
      <p>Several factors can contribute to market volatility:</p>
      <ul>
        <li>Economic factors (inflation, interest rates, etc.)</li>
        <li>Political events and policy changes</li>
        <li>Industry and sector performance</li>
        <li>Company-specific news and earnings reports</li>
        <li>Market sentiment and investor psychology</li>
      </ul>

      <h2>How to Navigate Volatile Markets</h2>
      <p>While volatility can be unsettling, it's a normal part of investing. Here are some strategies:</p>
      <ol>
        <li>Diversify your portfolio to spread risk</li>
        <li>Stay invested for the long term</li>
        <li>Consider dollar-cost averaging</li>
        <li>Keep some cash reserves</li>
        <li>Regularly review and rebalance your portfolio</li>
      </ol>

      <p>By understanding volatility and having a solid strategy, you can navigate market ups and downs with more confidence.</p>
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
