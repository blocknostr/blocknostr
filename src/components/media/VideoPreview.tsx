import React, { useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface VideoPreviewProps {
  url: string;
  playing: boolean; // Added playing prop
  onLoadedData: () => void; // Renamed from onLoad and made mandatory
  onError: () => void; // Made mandatory
  className?: string;
  // Removed autoPlay, controls, quality, enableHoverPlay as they are handled by useMediaHandling or not part of the new design
}

const VideoPreview = ({
  url,
  playing,
  onLoadedData,
  onError,
  className,
}: VideoPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    // Event listeners are attached directly to the video element
    // and call the passed-in handlers from useMediaHandling.
    videoElement.addEventListener('loadeddata', onLoadedData);
    videoElement.addEventListener('error', onError);

    // Clean up event listeners
    return () => {
      videoElement.removeEventListener('loadeddata', onLoadedData);
      videoElement.removeEventListener('error', onError);
    };
  }, [url, onLoadedData, onError]); // url dependency in case src changes and needs re-binding

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement) {
      if (playing) {
        videoElement.play().catch(error => {
          console.error('Error attempting to play video:', error);
          // Optionally call onError here if play itself fails, though 'error' event should also catch it
        });
      } else {
        videoElement.pause();
      }
    }
  }, [playing]); // Rerun only when playing state changes

  return (
    <video
      ref={videoRef}
      src={url}
      className={cn("w-full h-full object-contain", className)}
      muted // Always muted for autoplay according to requirements
      loop // Loop according to requirements
      playsInline // Essential for autoplay on iOS
      preload="metadata" // Good practice for videos, helps with loadeddata event
    // Removed controls, autoPlay - autoPlay is now handled by `playing` prop effect
    />
    // Removed internal loading/error states as they are handled by EnhancedMediaContent via useMediaHandling
  );
};

export default VideoPreview;
