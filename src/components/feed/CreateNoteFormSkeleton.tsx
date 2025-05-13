
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CreateNoteFormSkeleton = () => {
  return (
    <Card className="mb-8 p-5 animate-pulse">
      <div className="flex gap-4">
        <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-24 w-full rounded-md" />
          <div className="flex justify-between items-center pt-2">
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreateNoteFormSkeleton;
