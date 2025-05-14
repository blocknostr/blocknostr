
import React, { useState } from 'react';
import { LazyImage } from '../shared/LazyImage';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface EnhancedMediaContentProps {
  url: string;
  alt?: string;
  className?: string;
  variant?: 'inline' | 'lightbox' | 'carousel';
  index?: number;
  totalItems?: number;
}

const EnhancedMediaContent: React.FC<EnhancedMediaContentProps> = ({
  url,
  alt = "Media content",
  className,
  variant = 'inline',
  index = 0,
  totalItems = 1
}) => {
  const [error, setError] = useState(false);
  
  // Simple media type detection based on URL
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i) !== null;
  const isVideo = url.match(/\.(mp4|webm|mov)(\?.*)?$/i) !== null;
  
  if (!url) {
    return null;
  }
  
  // If URL is invalid or has an error, show error state
  if (error || !url.startsWith('http')) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center bg-muted/20 rounded-md p-4",
        className
      )}>
        <AlertTriangle className="h-5 w-5 text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground text-center">
          Unable to load media
        </p>
      </div>
    );
  }
  
  // For video content, render a simple placeholder
  if (isVideo) {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-md border border-border/10",
        className
      )}>
        <div className="flex items-center justify-center bg-muted/20 p-4 h-full w-full">
          <p className="text-sm text-muted-foreground">Video content (tap to view)</p>
        </div>
      </div>
    );
  }
  
  // For images, use the LazyImage component
  return (
    <div className={cn(
      "relative overflow-hidden rounded-md",
      className
    )}>
      <LazyImage
        src={url}
        alt={alt}
        className="h-full w-full object-cover"
        onLoadError={() => setError(true)}
        fallbackText="Failed to load image"
      />
    </div>
  );
};

export default React.memo(EnhancedMediaContent);
