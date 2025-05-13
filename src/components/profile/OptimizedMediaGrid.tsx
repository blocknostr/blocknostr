
import React, { useState } from 'react';
import { NostrEvent } from '@/lib/nostr';
import { extractFirstImageUrl } from '@/lib/nostr/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useInView } from 'react-intersection-observer';

interface OptimizedMediaGridProps {
  media: NostrEvent[];
  loading: boolean;
}

const OptimizedMediaGrid: React.FC<OptimizedMediaGridProps> = ({ media, loading }) => {
  // Show skeleton placeholders when loading
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="aspect-square rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }
  
  // Show message for no media
  if (!media || media.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No media found.
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {media.map(event => {
        const imageUrl = extractFirstImageUrl(event.content, event.tags);
        if (!imageUrl) return null;
        
        return <LazyMediaItem key={event.id} imageUrl={imageUrl} eventId={event.id} />;
      })}
    </div>
  );
};

// Component to lazy load each individual image
function LazyMediaItem({ imageUrl, eventId }: { imageUrl: string, eventId: string }) {
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  return (
    <div 
      ref={ref}
      className="aspect-square overflow-hidden rounded-md border bg-muted relative"
    >
      {inView ? (
        <>
          {!loaded && <Skeleton className="absolute inset-0" />}
          <img 
            src={imageUrl}
            alt="Media" 
            className={`h-full w-full object-cover transition-all hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setLoaded(true)}
            loading="lazy"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/post/${eventId}`;
            }}
          />
        </>
      ) : (
        <Skeleton className="h-full w-full" />
      )}
    </div>
  );
}

export default OptimizedMediaGrid;
