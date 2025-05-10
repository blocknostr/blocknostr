
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";

interface MediaLightboxProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  alt?: string;
  isVideo: boolean;
}

const MediaLightbox = ({ isOpen, onOpenChange, url, alt, isVideo }: MediaLightboxProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] p-1">
        {isVideo ? (
          <video 
            src={url}
            className="w-full h-auto max-h-[80vh]" 
            controls
            autoPlay={false}
          />
        ) : (
          <img 
            src={url} 
            alt={alt || "Media attachment"} 
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MediaLightbox;
