
import React from 'react';
import { AlertTriangle, FileVideo } from 'lucide-react';

interface MediaErrorStateProps {
  isVideo?: boolean;
}

const MediaErrorState: React.FC<MediaErrorStateProps> = ({ isVideo = false }) => {
  return (
    <div className="absolute inset-0 bg-muted/50 flex flex-col items-center justify-center text-muted-foreground gap-2">
      {isVideo ? (
        <FileVideo className="h-8 w-8 opacity-70" />
      ) : (
        <AlertTriangle className="h-8 w-8 opacity-70" />
      )}
      <p className="text-xs">Failed to load {isVideo ? 'video' : 'image'}</p>
    </div>
  );
};

export default MediaErrorState;
