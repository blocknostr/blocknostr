
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedLoadingSkeletonProps {
  count?: number;
}

const FeedLoadingSkeleton: React.FC<FeedLoadingSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden animate-pulse">
          <CardHeader className="pb-2">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            {index % 2 === 0 && (
              <Skeleton className="h-40 w-full rounded-md" />
            )}
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FeedLoadingSkeleton;

