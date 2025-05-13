
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const TabsNavSkeleton = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full mb-4",
      isMobile ? "grid grid-cols-5" : "flex"
    )}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton 
          key={i}
          className={cn(
            "inline-flex items-center justify-center h-8 flex-1 rounded-sm",
            i < 3 && "mr-1"
          )}
        />
      ))}
      <Skeleton className="h-8 w-8 rounded-sm" />
    </div>
  );
};

export default TabsNavSkeleton;
