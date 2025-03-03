export default function SocialsPage() {
  return (
    <main className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold mb-6">Socials</h1>
      <p>Follow us on social media:</p>
      <ul className="list-disc list-inside">
        <li>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
        </li>
        <li>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>
        </li>
        <li>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
        </li>
      </ul>
    </main>
  );
}
