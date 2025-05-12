
import React from 'react';
import { Card } from "@/components/ui/card";
import { Lightbox } from "@/components/ui/lightbox";

interface MediaGridProps {
  images: { url: string; eventId: string; }[];
}

export function MediaGrid({ images }: MediaGridProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  // Extract just the URLs for the lightbox
  const imageUrls = images.map(img => img.url);
  
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <Card 
            key={`${image.eventId}-${index}`}
            className="relative aspect-square overflow-hidden cursor-pointer"
            onClick={() => {
              setSelectedIndex(index);
              setOpen(true);
            }}
          >
            <img
              src={image.url}
              alt="Media content"
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                // Replace broken images with a placeholder
                (e.target as HTMLImageElement).src = 'https://placehold.co/400x400?text=Error';
              }}
            />
          </Card>
        ))}
      </div>
      
      <Lightbox 
        images={imageUrls}
        initialIndex={selectedIndex}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
