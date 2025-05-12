
import { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

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
  
  // Handle quality settings
  const getQualitySettings = () => {
    switch (quality) {
      case 'low':
        return { preload: 'metadata' as const };
      case 'medium':
        return { preload: 'auto' as const };
      case 'high':
        return { preload: 'auto' as const };
      default:
        return { preload: 'auto' as const };
    }
  };
  
  const qualitySettings = getQualitySettings();
  
  // Toggle play/pause when clicked if not in controls mode
  const handleVideoClick = () => {
    if (controls) return;
    
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };
  
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
    <video 
      ref={videoRef}
      src={url}
      className={cn("w-full h-full object-cover transition-opacity duration-300", className)}
      controls={controls}
      autoPlay={autoPlay}
      muted
      loop
      playsInline
      onClick={handleVideoClick}
      onLoadedData={onLoad}
      onError={onError}
      {...qualitySettings}
    />
  );
};

export default VideoPreview;
