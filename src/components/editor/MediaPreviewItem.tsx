
import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface MediaPreviewItemProps {
  media: {
    file: File;
    preview: string;
    type: 'image' | 'video';
  };
  onRemove: () => void;
}

const MediaPreviewItem: React.FC<MediaPreviewItemProps> = ({ media, onRemove }) => {
  return (
    <div className="relative group rounded-md overflow-hidden border">
      <AspectRatio ratio={16/9} className="bg-muted">
        {media.type === 'image' ? (
          <img
            src={media.preview}
            alt={media.file.name}
            className="object-cover w-full h-full"
          />
        ) : (
          <video
            src={media.preview}
            className="object-cover w-full h-full"
            controls
          />
        )}
      </AspectRatio>
      
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove media</span>
      </Button>
    </div>
  );
};

export default MediaPreviewItem;
