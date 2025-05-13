
import { useState } from 'react';
import MediaCarousel from './media/MediaCarousel';
import MediaLightbox from './media/MediaLightbox';
import { useMediaPreferences } from '@/hooks/useMediaPreferences';
import { cn } from '@/lib/utils';

interface MediaPreviewProps {
  url: string | string[];
  alt?: string;
  className?: string;
  variant?: 'feed' | 'post' | 'profile';
  onMediaLoad?: () => void;
}

const MediaPreview = ({ 
  url, 
  alt, 
  className,
  variant = 'feed',
  onMediaLoad
}: MediaPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { mediaPrefs } = useMediaPreferences();
  
  // Convert single URL to array for consistent handling
  const urls = Array.isArray(url) ? url : [url];
  
  const handleExpandClick = (index: number) => {
    setSelectedIndex(index);
    setIsOpen(true);
  };
  
  // Dynamically set container classes based on variant
  const getContainerClass = () => {
    switch (variant) {
      case 'post':
        return "mt-4 max-w-2xl";
      case 'profile':
        return "w-full aspect-square";
      case 'feed':
      default:
        return "mt-3";
    }
  };
  
  return (
    <>
      <div className={cn(getContainerClass(), className)}>
        <MediaCarousel 
          urls={urls}
          onExpandClick={handleExpandClick}
          className={
            variant === 'profile' 
              ? "h-full max-h-[300px] object-cover" 
              : undefined
          }
        />
      </div>
      
      {mediaPrefs.dataSaverMode === false && (
        <MediaLightbox
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          urls={urls}
          initialIndex={selectedIndex}
        />
      )}
    </>
  );
};

export default MediaPreview;
