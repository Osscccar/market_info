import Image from "next/image";
import { CalendarDays } from "lucide-react";

export default function Page() {
  const article = {
    title: "Investing Strategies for Beginners",
    author: "Market Analyst Admin",
    date: "2025-03-05",
    image: "/images/stockcrash2025march",
    content: `
      <p>Investing can seem daunting for beginners, but with the right strategies, anyone can start building their wealth. 
      Here are some fundamental investing strategies that every beginner should know:</p>

      <h2>1. Start with a Clear Financial Plan</h2>
      <p>Before you invest, define your financial goals, risk tolerance, and investment timeline. 
      This will help guide your investment decisions and keep you focused on the long term.</p>

      <h2>2. Diversify Your Portfolio</h2>
      <p>Don't put all your eggs in one basket. Spread your investments across different asset classes 
      (stocks, bonds, real estate) and sectors to minimize risk.</p>

      <h2>3. Invest in Low-Cost Index Funds</h2>
      <p>For beginners, index funds offer a simple way to invest in a broad market index, 
      providing diversification and typically lower fees.</p>

      <h2>4. Practice Dollar-Cost Averaging</h2>
      <p>Instead of trying to time the market, invest a fixed amount regularly. 
      This strategy can help reduce the impact of market volatility on your investments.</p>

      <h2>5. Reinvest Dividends</h2>
      <p>Consider reinvesting dividends to buy more shares, potentially boosting your returns over time.</p>

      <h2>6. Keep an Emergency Fund</h2>
      <p>Before investing heavily, ensure you have an emergency fund to cover 3-6 months of expenses. 
      This can prevent you from having to sell investments at a loss if unexpected costs arise.</p>

      <h2>7. Stay Informed, But Avoid Overreacting</h2>
      <p>Keep up with financial news, but avoid making impulsive decisions based on short-term market movements.</p>

      <p>By staying patient, continuing to learn, and seeking professional advice when needed, 
      you can lay a strong foundation for your investing journey.</p>
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
