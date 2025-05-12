
import React from 'react';
import { Card } from "@/components/ui/card";
import { Lightbox } from "@/components/ui/lightbox"; // This would need to be implemented

interface MediaGridProps {
  images: { url: string; eventId: string; }[];
}

export function MediaGrid({ images }: MediaGridProps) {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <Card 
            key={`${image.eventId}-${index}`}
            className="relative aspect-square overflow-hidden cursor-pointer"
            onClick={() => setSelectedImage(image.url)}
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
      
      {/* This is a simplified placeholder - a real implementation would need a proper lightbox component */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Full size media"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  );
}
