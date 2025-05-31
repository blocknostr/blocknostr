
import React from 'react';

const MediaLoadingState: React.FC = () => {
  return (
    <div className="absolute inset-0 bg-muted/30 flex items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
    </div>
  );
};

export default MediaLoadingState;

