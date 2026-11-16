import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-white/60">That site or report does not exist.</p>
        <Link href="/explore" className="mt-5 inline-block rounded-full bg-sky-400 px-5 py-2 text-sm font-semibold text-slate-950">
          Explore sites
        </Link>
      </div>
    </main>
  );
}
