
import React from 'react';
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface MediaPreviewListProps {
  mediaUrls: string[];
  removeMedia: (url: string) => void;
}

const MediaPreviewList: React.FC<MediaPreviewListProps> = ({
  mediaUrls,
  removeMedia
}) => {
  if (mediaUrls.length === 0) {
    return null;
  }
  
  const getGridCols = (count: number) => {
    if (count === 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    return "grid-cols-3";
  };
  
  return (
    <div className="mt-4 mb-2">
      <div className={cn(
        "grid gap-2",
        getGridCols(mediaUrls.length)
      )}>
        {mediaUrls.map((url, index) => (
          <div 
            key={`${url}-${index}`} 
            className="relative group rounded-md overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <img 
              src={url} 
              alt="Media preview" 
              className={cn(
                "h-24 w-full object-cover rounded-md transition-transform duration-300",
                "group-hover:scale-105 group-hover:brightness-90"
              )}
            />
            <button
              type="button"
              onClick={() => removeMedia(url)}
              className={cn(
                "absolute top-1 right-1 bg-background/80 rounded-full p-1",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "hover:bg-background hover:text-destructive"
              )}
              aria-label="Remove media"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaPreviewList;
