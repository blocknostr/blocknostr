
import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import FeedLoadingSkeleton from "../feed/FeedLoadingSkeleton";

interface ProfileLoadingSkeletonProps {
  count?: number;
}

const ProfileLoadingSkeleton: React.FC<ProfileLoadingSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      <FeedLoadingSkeleton count={count} />
    </div>
  );
};

export default ProfileLoadingSkeleton;
