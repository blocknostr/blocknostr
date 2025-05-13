
import { NostrEvent } from "@/lib/nostr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageOff, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface MyCubeMediaProps {
  media: NostrEvent[];
  loading: boolean;
}

// Helper function to extract media URLs from content
const extractMediaUrls = (content: string): string[] => {
  const urlRegex = /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi;
  const matches = content.match(urlRegex) || [];
  return matches;
};

// Helper function to extract URLs from specific media tags
const extractMediaFromTags = (event: NostrEvent): string[] => {
  if (!event.tags) return [];
  
  const mediaTags = event.tags.filter(tag => 
    tag[0] === 'image' || tag[0] === 'media' || (tag[0] === 'r' && /\.(jpg|jpeg|png|gif|webp)$/i.test(tag[1]))
  );
  
  return mediaTags.map(tag => tag[1]);
};

const MyCubeMedia = ({ media, loading }: MyCubeMediaProps) => {
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [loadingMedia, setLoadingMedia] = useState<boolean>(true);

  useEffect(() => {
    const extractAllMedia = () => {
      let allUrls: string[] = [];
      
      media.forEach(event => {
        // Extract URLs from content
        const contentUrls = extractMediaUrls(event.content);
        
        // Extract URLs from tags
        const tagUrls = extractMediaFromTags(event);
        
        allUrls = [...allUrls, ...contentUrls, ...tagUrls];
      });
      
      // Deduplicate URLs
      const uniqueUrls = [...new Set(allUrls)];
      setMediaUrls(uniqueUrls);
      setLoadingMedia(false);
    };
    
    extractAllMedia();
  }, [media]);

  if (loading || loadingMedia) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (mediaUrls.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <ImageOff className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Media Found</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          No images or media found in your posts.
        </p>
      </Card>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaUrls.map((url, index) => (
          <div key={`${url}-${index}`} className="relative aspect-square rounded-md overflow-hidden bg-muted">
            <img
              src={url}
              alt={`Media ${index + 1}`}
              className="object-cover w-full h-full"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
      
      {mediaUrls.length > 0 && (
        <div className="flex justify-center mt-6">
          <Button variant="outline">Load More</Button>
        </div>
      )}
    </div>
  );
};

export default MyCubeMedia;
