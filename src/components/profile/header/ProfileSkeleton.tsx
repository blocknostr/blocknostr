
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSkeleton = () => {
  return (
    <div className="relative">
      {/* Banner skeleton */}
      <Skeleton className="h-48 md:h-64 w-full rounded-t-lg" />
      
      <div className="relative px-4 pb-4">
        <div className="flex justify-between items-start">
          {/* Avatar skeleton */}
          <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full absolute -top-16 left-4 border-4 border-background shadow-xl" />
          
          {/* Button skeleton */}
          <Skeleton className="h-9 w-24 mt-4" />
        </div>
        
        <div className="mt-20">
          {/* Name skeleton */}
          <Skeleton className="h-8 w-40 mb-2" />
          
          {/* Username skeleton */}
          <Skeleton className="h-4 w-32 mb-2" />
          
          {/* Joined skeleton */}
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
