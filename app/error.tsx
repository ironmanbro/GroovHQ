'use client';
export default function Error({ reset }: { reset: () => void }) {
  return <main className="min-h-dvh grid place-items-center text-center p-8"><div>
    <p className="font-display text-3xl chrome-text">The menu didn&apos;t load.</p>
    <button onClick={reset} className="mt-6 rounded-full border border-gun px-6 py-3 text-sm tracking-widest uppercase">Try again</button>
  </div></main>;
}
