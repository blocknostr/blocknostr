import React, { useState, useEffect, useMemo } from 'react';
import MediaLoadingState from './MediaLoadingState';
import MediaErrorState from './MediaErrorState';
import VideoPreview from './VideoPreview';
import { cn } from '@/lib/utils';
import { isValidMediaUrl, normalizeUrl } from '@/lib/nostr/utils/media/media-validation';
import { useMediaHandling } from '@/hooks/useMediaHandling';

interface EnhancedMediaContentProps {
  url: string;
  alt?: string;
  variant?: 'lightbox' | 'carousel' | 'inline' | 'profile';
  className?: string;
}

const EnhancedMediaContent: React.FC<EnhancedMediaContentProps> = ({
  url,
  alt = 'Media content',
  variant = 'inline',
  className,
}) => {
  const [normalizedUrl, setNormalizedUrl] = useState<string | null>(null); // Initialize as null
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [isUrlProcessing, setIsUrlProcessing] = useState(true);
  const [urlValidationError, setUrlValidationError] = useState(false);

  useEffect(() => {
    console.log(`[EnhancedMediaContent] URL prop changed: ${url}`);
    let currentUrl = '';
    setIsUrlProcessing(true);
    setUrlValidationError(false);
    setNormalizedUrl(null); // Reset on URL change
    setIsValidUrl(false);   // Reset on URL change

    if (!url) {
      console.warn('[EnhancedMediaContent] Empty URL provided.');
      setUrlValidationError(true);
      setIsUrlProcessing(false);
      return;
    }

    try {
      currentUrl = normalizeUrl(url);
      const valid = isValidMediaUrl(currentUrl);
      setNormalizedUrl(currentUrl);
      setIsValidUrl(valid);
      console.log(`[EnhancedMediaContent] Normalized URL: ${currentUrl}, Valid: ${valid}`);
      if (!valid) {
        console.warn('[EnhancedMediaContent] Invalid media URL after normalization:', currentUrl);
        setUrlValidationError(true);
      }
    } catch (err) {
      console.warn('[EnhancedMediaContent] Failed to normalize or validate URL:', url, err);
      setNormalizedUrl(url); // Fallback to original URL
      setIsValidUrl(false);
      setUrlValidationError(true);
    } finally {
      setIsUrlProcessing(false);
    }
  }, [url]);

  const isVideo = useMemo(() => {
    if (!isValidUrl || !normalizedUrl) return false;
    try {
      const pathname = new URL(normalizedUrl).pathname;
      // Ensure this regex matches the comprehensive list of video extensions
      return pathname.match(/\.(mp4|webm|mov|avi|wmv|mkv|flv|m4v|ogv)$/i) !== null;
    } catch (err) {
      return false;
    }
  }, [normalizedUrl, isValidUrl]);

  // Only call useMediaHandling if we have a valid, normalized URL
  const mediaHandler = useMediaHandling({
    url: normalizedUrl || '', // Pass empty string if null, hook should handle it
    isVideo,
    preload: variant === 'lightbox',
    // Ensure the hook doesn't run prematurely by skipping if normalizedUrl is null
    // This skip is internal to useMediaHandling now based on its own url check
  });

  // Destructure after the conditional hook call setup
  const {
    ref,
    isLoaded,
    error: mediaError,
    playing,
    shouldLoad,
    handleLoad,
    handleError,
    inView, // for logging
    everInView // for logging
  } = mediaHandler;

  useEffect(() => {
    if (normalizedUrl && isValidUrl) {
      console.log('[EnhancedMediaContent] Media Handler State:', { url: normalizedUrl, isVideo, shouldLoad, isLoaded, mediaError, inView, everInView, playing });
    }
  }, [normalizedUrl, isValidUrl, isVideo, shouldLoad, isLoaded, mediaError, inView, everInView, playing]);


  if (isUrlProcessing) {
    console.log('[EnhancedMediaContent] Rendering: URL Processing');
    return (
      <div className={cn("relative flex items-center justify-center overflow-hidden rounded-md border border-border/10 aspect-video", className)}>
        <MediaLoadingState />
      </div>
    );
  }

  if (urlValidationError || !isValidUrl || !normalizedUrl) {
    console.log(`[EnhancedMediaContent] Rendering: URL Error or Invalid. URL: ${url}, Normalized: ${normalizedUrl}, Valid: ${isValidUrl}`);
    return (
      <div className={cn("relative overflow-hidden rounded-md border border-border/10 aspect-video", className)}>
        <MediaErrorState isVideo={false} url={url} />
      </div>
    );
  }

  // This is the main container that IntersectionObserver will observe
  // It's always rendered once URL processing is done and URL is valid.
  return (
    <div
      ref={ref} // Attach ref here so IntersectionObserver can see this element
      className={cn("relative overflow-hidden rounded-md aspect-video", className)}
    >
      {mediaError ? (
        <MediaErrorState isVideo={isVideo} url={normalizedUrl} />
      ) : shouldLoad && isLoaded ? (
        isVideo ? (
          <VideoPreview
            url={normalizedUrl}
            playing={playing}
            onLoadedData={handleLoad}
            onError={handleError}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={normalizedUrl}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={cn("w-full h-full object-contain opacity-100 transition-opacity duration-300")}
          // Removed style={{ display: isLoaded ? 'block' : 'none' }} as isLoaded is true here
          />
        )
      ) : shouldLoad && !isLoaded ? ( // Loading state for when we should load but haven't yet
        <>
          {console.log(`[EnhancedMediaContent] Rendering: MediaLoadingState for ${normalizedUrl}`)}
          <MediaLoadingState />
        </>
      ) : (
        // Fallback for when !shouldLoad (e.g., not in view, no preload)
        // This ensures the div with the ref is in the DOM.
        // You can put a very lightweight placeholder here if desired, e.g., bg-muted/30
        <>
          {console.log(`[EnhancedMediaContent] Rendering: Placeholder (shouldLoad: ${shouldLoad}) for ${normalizedUrl}`)}
          <div className="w-full h-full bg-muted/10" />
        </>
      )}
    </div>
  );
};

export default EnhancedMediaContent;
