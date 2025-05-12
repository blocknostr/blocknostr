
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const CommunityCardSkeleton = () => {
  return (
    <Card className="overflow-hidden bg-card h-[320px]">
      <Skeleton className="h-36 w-full rounded-t-lg" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-20 w-full" />
        <div className="flex items-center gap-2 pt-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </Card>
  );
};

export default CommunityCardSkeleton;
