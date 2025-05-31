
import React from 'react';
import { AlertTriangle, FileVideo, Image, ExternalLink } from 'lucide-react';

interface MediaErrorStateProps {
  isVideo?: boolean;
  url?: string;
  onRetry?: () => void;
  canRetry?: boolean;
}

const MediaErrorState: React.FC<MediaErrorStateProps> = ({ 
  isVideo = false,
  url,
  onRetry,
  canRetry = false
}) => {
  const handleRetry = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRetry) onRetry();
  };
  
  const handleViewSource = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex flex-col items-center justify-center text-muted-foreground gap-2">
      {isVideo ? (
        <FileVideo className="h-8 w-8 opacity-70" />
      ) : (
        <Image className="h-8 w-8 opacity-70" />
      )}
      <p className="text-xs">Failed to load {isVideo ? 'video' : 'image'}</p>
      
      <div className="flex gap-2 mt-1">
        {canRetry && onRetry && (
          <button 
            onClick={handleRetry} 
            className="text-xs px-2 py-1 bg-background/80 hover:bg-background rounded-md text-foreground flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Retry
          </button>
        )}
        
        {url && (
          <button 
            onClick={handleViewSource} 
            className="text-xs px-2 py-1 bg-background/80 hover:bg-background rounded-md text-foreground flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            View Source
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaErrorState;

