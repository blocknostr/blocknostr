
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesSkeletonProps {
  count?: number;
  view?: "grid" | "list";
}

const NotesSkeleton = ({ count = 4, view = "grid" }: NotesSkeletonProps) => {
  return (
    <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="h-6 w-2/3 mb-2" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-4 w-4 mx-2 rounded-full" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mt-3" />
            <Skeleton className="h-4 w-5/6 mt-2" />
            <Skeleton className="h-4 w-4/6 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default NotesSkeleton;
