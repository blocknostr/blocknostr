
import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Play, Pause, Volume, VolumeOff } from "lucide-react";

interface VideoPreviewProps {
  url: string;
  onLoad: () => void;
  onError: () => void;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
}

const VideoPreview = ({ 
  url, 
  onLoad, 
  onError, 
  autoPlay = false,
  controls = false,
  className,
  quality = 'high'
}: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  
  // Handle quality settings
  const getQualitySettings = () => {
    switch (quality) {
      case 'low':
        return { preload: 'none' as const };
      case 'medium':
        return { preload: 'metadata' as const };
      case 'high':
        return { preload: 'auto' as const };
      default:
        return { preload: 'auto' as const };
    }
  };
  
  const qualitySettings = getQualitySettings();
  
  // Toggle play/pause when clicked if not in controls mode
  const handleTogglePlay = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error("Error playing video:", err);
            // Might be blocked by browser policy
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);
  
  // Toggle mute state
  const handleToggleMute = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  }, []);
  
  // Show/hide controls on hover
  const handleMouseEnter = () => setShowControls(true);
  const handleMouseLeave = () => setShowControls(false);
  
  // Pause video when it goes out of view
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (!videoElement) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          // Only affect videos that were autoplaying
          if (autoPlay) {
            if (entry.isIntersecting) {
              if (videoElement.paused && isPlaying) {
                videoElement.play().catch(() => {
                  // Autoplay might be blocked by browser, ignore
                });
              }
            } else {
              if (!videoElement.paused) {
                videoElement.pause();
                // Don't update isPlaying state to remember previous state
              }
            }
          }
        });
      },
      { threshold: 0.2 }
    );
    
    observer.observe(videoElement);
    
    return () => {
      if (videoElement) {
        observer.unobserve(videoElement);
      }
    };
  }, [autoPlay, isPlaying]);

  return (
    <div 
      className="relative w-full h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video 
        ref={videoRef}
        src={url}
        className={cn("w-full h-full object-cover transition-opacity duration-300", className)}
        controls={controls}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        onClick={controls ? undefined : handleTogglePlay}
        onLoadedData={onLoad}
        onError={onError}
        {...qualitySettings}
      />
      
      {/* Custom video controls overlay */}
      {!controls && showControls && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
          onClick={handleTogglePlay}
        >
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <button
              onClick={handleTogglePlay}
              className="p-1 rounded-full bg-background/80 text-foreground"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            
            <button
              onClick={handleToggleMute}
              className="p-1 rounded-full bg-background/80 text-foreground"
            >
              {isMuted ? (
                <VolumeOff className="h-4 w-4" />
              ) : (
                <Volume className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
