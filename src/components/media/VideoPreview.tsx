
import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  url: string;
  onLoadedData?: () => void;
  onError?: () => void;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  quality?: 'low' | 'medium' | 'high';
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  url, 
  onLoadedData, 
  onError, 
  autoPlay = false,
  controls = false,
  className,
  quality = 'high'
}: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [hasLoaded, setHasLoaded] = useState(false);
  
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
        videoRef.current.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.error("Error playing video:", error);
          });
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Handle video load events
  const handleLoadedData = () => {
    console.log("Video loaded successfully:", url);
    setHasLoaded(true);
    if (onLoadedData) {
      onLoadedData();
    }
  };

  // Handle video error events
  const handleError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error("Error loading video:", url, e);
    if (onError) {
      onError();
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
      onLoadedData={handleLoadedData}
      onError={handleError}
      {...qualitySettings}
    />
  );
};

export default VideoPreview;
