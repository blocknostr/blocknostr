
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const FeedLoadingSkeleton = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-md" />
                </div>
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-4/6 rounded-md" />
              </div>
              {index === 1 && (
                <Skeleton className="mt-3 h-40 w-full rounded-md" />
              )}
              <div className="flex items-center gap-4 mt-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default FeedLoadingSkeleton;
