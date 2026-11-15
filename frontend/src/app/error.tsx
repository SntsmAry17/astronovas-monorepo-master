"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-white/60">The page could not be displayed. You can try again.</p>
        <button
          onClick={reset}
          className="mt-5 rounded-full border border-white/20 px-5 py-2 text-sm hover:bg-white/10"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
