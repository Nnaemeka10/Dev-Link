import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";

const PLACEHOLDER_COUNT = 6;

export default function ListingsSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: PLACEHOLDER_COUNT }).map((_, index) => (
        <Card key={index} className="flex h-full flex-col justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-10 w-28 rounded-[1.2rem]" />
          </div>
        </Card>
      ))}
    </section>
  );
}
