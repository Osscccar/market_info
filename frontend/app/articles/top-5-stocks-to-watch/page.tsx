import Image from "next/image";
import { CalendarDays } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Page() {
  const article = {
    title: "Top 5 Stocks to Watch in 2025",
    author: "John Smith",
    date: "2025-03-10",
    image: "/placeholder.svg?height=400&width=800",
    content: `
      <p>As we move further into 2025, the stock market continues to evolve, presenting new opportunities for investors. 
      Here are five stocks that analysts are keeping a close eye on this year:</p>

      <h2>1. GreenTech Innovations (GTI)</h2>
      <p>A leader in sustainable energy solutions, GTI has shown remarkable growth over the past year. 
      With governments worldwide pushing for greener technologies, GTI is well-positioned to capitalize on this trend.</p>

      <h2>2. QuantumComp Systems (QCS)</h2>
      <p>As quantum computing moves from theory to practical applications, QCS is at the forefront of this revolutionary technology. 
      Their recent breakthroughs have garnered significant attention from both the tech industry and investors.</p>

      <h2>3. BioGenix Pharmaceuticals (BGP)</h2>
      <p>With several promising drugs in late-stage clinical trials, BGP is poised for potential breakthroughs 
      in cancer treatment and neurodegenerative diseases.</p>

      <h2>4. NexusAI Corporation (NAIC)</h2>
      <p>As artificial intelligence continues to transform industries, NAIC has established itself as a key player in AI infrastructure. 
      Their recent partnerships with major tech companies have boosted their market position.</p>

      <h2>5. OmniMobility Technologies (OMT)</h2>
      <p>With the electric and autonomous vehicle market heating up, OMT has gained attention for its advanced driver-assistance systems. 
      As traditional automakers transition to electric, OMT's components are in high demand.</p>

      <p>Remember, while these stocks show promise, always do your own research and consider your personal financial goals and risk tolerance.</p>
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
