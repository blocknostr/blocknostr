
import React from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

interface FeedLoadingProps {
  activeHashtag?: string;
  mediaOnly?: boolean;
}

const FeedLoading: React.FC<FeedLoadingProps> = ({ activeHashtag, mediaOnly }) => {
  return (
    <>
      {/* Loading indicator at the top */}
      <div className="flex flex-col items-center justify-center py-4 mb-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">
          Loading {mediaOnly ? 'media ' : ''}posts{activeHashtag ? ` with #${activeHashtag}` : ''}...
        </p>
      </div>
      
      {/* Content placeholder skeletons */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 rounded-lg border shadow-sm">
            {/* Header skeleton */}
            <div className="flex items-start space-x-3 mb-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-2 ml-[60px] mb-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            
            {/* Footer skeleton */}
            <div className="flex justify-between ml-[60px]">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

export default FeedLoading;
