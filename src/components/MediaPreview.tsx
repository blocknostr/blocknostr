
import { useState } from 'react';
import MediaCarousel from './media/MediaCarousel';
import MediaLightbox from './media/MediaLightbox';

interface MediaPreviewProps {
  url: string | string[];
  alt?: string;
}

const MediaPreview = ({ url, alt }: MediaPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Convert single URL to array for consistent handling
  const urls = Array.isArray(url) ? url : [url];
  
  const handleExpandClick = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(true);
  };
  
  return (
    <>
      <div className="mt-3">
        <MediaCarousel 
          urls={urls}
          onExpandClick={handleExpandClick}
        />
      </div>
      
      <MediaLightbox
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        urls={urls}
        initialIndex={selectedIndex}
      />
    </>
  );
};

export default MediaPreview;
