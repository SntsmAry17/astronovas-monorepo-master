import { Skeleton, SkeletonRegion } from "@/components/ui";

/** Generic route skeleton shown while a page streams in. */
export default function Loading() {
  return (
    <SkeletonRegion label="Loading…" className="mx-auto w-full max-w-4xl space-y-4 px-5 pb-24 pt-24">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid gap-3 pt-4 sm:grid-cols-2">
        <Skeleton className="h-32 w-full" radius="2xl" />
        <Skeleton className="h-32 w-full" radius="2xl" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </SkeletonRegion>
  );
}
