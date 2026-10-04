"use client";

import Link from "next/link";

/** Last-resort fallback: anything that still breaks a page lands here, never on a blank screen. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-6 px-edge">
      <p className="t-eyebrow">Something went wrong</p>
      <h1 className="t-h1">This page hit a snag.</h1>
      <div className="flex flex-wrap items-center gap-6">
        <button type="button" onClick={reset} className="t-label tlink text-fg">
          Try again
        </button>
        <Link href="/" className="t-label tlink text-fg">
          Home
        </Link>
      </div>
    </main>
  );
}
