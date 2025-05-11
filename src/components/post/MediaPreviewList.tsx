
import React from 'react';

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
  
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {mediaUrls.map((url, index) => (
        <div key={`${url}-${index}`} className="relative group rounded-md overflow-hidden">
          <img 
            src={url} 
            alt="Media preview" 
            className="h-16 w-16 object-cover"
          />
          <button
            type="button"
            onClick={() => removeMedia(url)}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
            aria-label="Remove media"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
};

export default MediaPreviewList;
