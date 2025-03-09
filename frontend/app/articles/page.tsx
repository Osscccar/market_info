import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";

const articles = [
  {
    slug: "us-market-crash-today",
    title: "US Market Crashes, Billions Lost in a Single Day",
    excerpt:
      "Major indexes tumbled, wiping out billions of dollars in market value as panic spreads among investors.",
    author: "Market Analyst Admin",
    date: "2025-03-16",
    image: "/stockcrash2025march.png?height=200&width=400",
  },
  {
    slug: "understanding-market-volatility",
    title: "Understanding Market Volatility: A Beginner's Guide",
    excerpt:
      "Learn about what causes market volatility and how to navigate turbulent times in the stock market.",
    author: "Market Analyst Admin",
    date: "2025-03-15",
    image: "/market.jpg?height=200&width=400",
  },
  {
    slug: "top-5-stocks-to-watch",
    title: "Top 5 Stocks to Watch in 2025",
    excerpt:
      "Discover the most promising stocks that analysts are keeping an eye on for the upcoming year.",
    author: "Market Analyst Admin",
    date: "2025-03-10",
    image: "/placeholder.svg?height=200&width=400",
  },
  {
    slug: "investing-strategies-for-beginners",
    title: "Investing Strategies for Beginners",
    excerpt:
      "Get started with investing by learning these fundamental strategies that every beginner should know.",
    author: "Market Analyst Admin",
    date: "2025-03-05",
    image: "/placeholder.svg?height=200&width=400",
  },
];

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Articles</h1>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              href={`/articles/${article.slug}`}
              key={article.slug}
              className="block"
            >
              <article className="bg-gray-900/50 border border-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800/50 transition-colors">
                <Image
                  src={article.image || "/placeholder.svg"}
                  alt={`Cover image for ${article.title}`}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">
                    {article.title}
                  </h2>
                  <p className="text-gray-400 mb-4">{article.excerpt}</p>
                  <div className="flex items-center text-sm text-gray-500">
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
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
