import React from "react";
import { Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CommunitiesLoadingProps {
  message?: string;
  variant?: 'page' | 'grid' | 'inline';
  count?: number;
}

const CommunitiesLoading: React.FC<CommunitiesLoadingProps> = ({
  message = "Loading communities from Nostr network...",
  variant = 'page',
  count = 9
}) => {
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{message}</span>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-40 bg-muted animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Page variant (default)
  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="relative">
        <Users className="h-12 w-12 text-muted-foreground" />
        <Loader2 className="h-6 w-6 text-primary animate-spin absolute -top-1 -right-1" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium">Loading Communities</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {message}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
      </div>
    </div>
  );
};

export default CommunitiesLoading; 
