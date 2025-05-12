
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-4">
      {/* Banner skeleton */}
      <Skeleton className="w-full h-32 md:h-48 rounded-t-lg" />
      
      <div className="px-4 space-y-4">
        {/* Avatar and action button */}
        <div className="flex justify-between items-start">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-9 w-24" />
        </div>
        
        {/* Name and details */}
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        
        {/* Stats skeleton */}
        <div className="flex space-x-4 pt-4">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}
