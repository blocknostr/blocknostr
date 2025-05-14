import { useState, useEffect, useCallback } from 'react';
import { useInView } from '../components/shared/useInView';

interface MediaHandlingOptions {
  url: string;
  isVideo?: boolean;
  variant?: 'lightbox' | 'carousel' | 'inline' | 'profile';
  preload?: boolean;
}

export function useMediaHandling({
  url,
  isVideo = false,
  variant = 'inline', // Default variant
  preload = false,
}: MediaHandlingOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [everInView, setEverInView] = useState(false);

  // Log the options passed to the hook
  useEffect(() => {
    console.log(`[useMediaHandling] Options for ${url}:`, { isVideo, variant, preload });
  }, [url, isVideo, variant, preload]);

  const { ref, inView } = useInView({
    threshold: 0.1,
    skip: preload,
  });

  // Log the raw inView value from useInView
  useEffect(() => {
    console.log(`[useMediaHandling] Raw inView for ${url}: ${inView}`);
  }, [url, inView]);

  useEffect(() => {
    if (inView && !everInView) {
      console.log(`[useMediaHandling] ${url} came into view (inView: ${inView}), setting everInView to true.`);
      setEverInView(true);
    }
  }, [inView, everInView, url]);

  useEffect(() => {
    console.log(`[useMediaHandling] URL/Preload/IsVideo changed for ${url}. Resetting state. Preload: ${preload}, IsVideo: ${isVideo}`);
    setIsLoaded(false);
    setError(false);
    setPlaying(false);
    setEverInView(preload);
    if (preload && isVideo) {
      setPlaying(true);
    }
  }, [url, preload, isVideo]);

  const shouldLoad = everInView || preload;

  useEffect(() => {
    console.log(`[useMediaHandling] Decision for ${url}: everInView=${everInView}, preload=${preload} => shouldLoad=${shouldLoad}`);
  }, [url, everInView, preload, shouldLoad]);

  useEffect(() => {
    if (isVideo) {
      if (inView || preload) {
        if (!playing) {
          setPlaying(true);
        }
      } else {
        if (playing) {
          setPlaying(false);
        }
      }
    }
  }, [inView, isVideo, preload, playing, url]);

  const handleLoad = useCallback(() => {
    console.log(`[useMediaHandling] Media loaded successfully: ${url}`);
    setIsLoaded(true);
    setError(false);
  }, [url]);

  const handleError = useCallback(() => {
    console.error(`[useMediaHandling] Media failed to load (handleError): ${url}`);
    setError(true);
    setIsLoaded(false);
  }, [url]);

  return {
    ref,
    inView,
    isLoaded,
    error,
    playing,
    shouldLoad,
    handleLoad,
    handleError,
    everInView,
  };
}
