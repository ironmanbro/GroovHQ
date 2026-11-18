import Link from 'next/link';
export default function NotFound() {
  return <main className="min-h-dvh grid place-items-center text-center p-8"><div>
    <p className="font-display text-4xl chrome-text">Lost in the dark.</p>
    <Link href="/" className="mt-6 inline-block text-sm tracking-[.3em] uppercase text-silver underline underline-offset-8">Back to menu</Link>
  </div></main>;
}
