
import { useState, useEffect } from 'react';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Video, Image, Expand } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MediaPreviewProps {
  url: string;
  alt?: string;
}

const MediaPreview = ({ url, alt }: MediaPreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    // Determine if the URL is for a video
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    setIsVideo(videoExtensions.some(ext => url.toLowerCase().endsWith(ext)));
    
    // Reset states when URL changes
    setIsLoaded(false);
    setError(false);
  }, [url]);
  
  const handleImageLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
  };
  
  return (
    <>
      <div className="mt-3 rounded-lg overflow-hidden border border-border bg-accent/20 relative group">
        <AspectRatio ratio={16/9} className="bg-muted">
          {isVideo ? (
            <video 
              src={url}
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              controls={false}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={handleImageLoad}
              onError={handleError}
            />
          ) : (
            <img 
              src={url} 
              alt={alt || "Media attachment"} 
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleImageLoad}
              onError={handleError}
            />
          )}
          
          {!isLoaded && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2 text-muted-foreground">
              {isVideo ? <Video className="w-8 h-8" /> : <Image className="w-8 h-8" />}
              <span className="text-sm">Unable to load media</span>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
            onClick={() => setIsOpen(true)}
          >
            <Expand className="h-4 w-4" />
            <span className="sr-only">View fullscreen</span>
          </Button>
        </AspectRatio>
      </div>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl w-[90vw] p-1">
          {isVideo ? (
            <video 
              src={url}
              className="w-full h-auto max-h-[80vh]" 
              controls
              autoPlay={false}
            />
          ) : (
            <img 
              src={url} 
              alt={alt || "Media attachment"} 
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaPreview;
