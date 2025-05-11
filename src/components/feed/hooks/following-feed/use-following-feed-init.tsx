
import { useState, useEffect } from "react";
import { nostrService, contentCache } from "@/lib/nostr";
import { toast } from "sonner";

interface UseFollowingFeedInitProps {
  following: string[];
  activeHashtag?: string;
  loadFromCache: (feedType: string, cacheSince?: number, cacheUntil?: number) => boolean;
  setEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setLoading: (loading: boolean) => void;
  setHasMore: (hasMore: boolean) => void;
  setupSubscription: (since: number, until: number) => string | null;
  setSubId: (subId: string | null) => void;
  setConnectionAttempted: (attempted: boolean) => void;
  setRetryCount: (callback: (prev: number) => number) => void;
  setCacheHit: (cacheHit: boolean) => void;
  setLoadingFromCache: (loading: boolean) => void;
}

export function useFollowingFeedInit({
  following,
  activeHashtag,
  loadFromCache,
  setEvents,
  setLoading,
  setHasMore,
  setupSubscription,
  setSubId,
  setConnectionAttempted,
  setRetryCount,
  setCacheHit,
  setLoadingFromCache
}: UseFollowingFeedInitProps) {
  
  const initFeed = async (forceReconnect = false) => {
    setLoading(true);
    const currentTime = Math.floor(Date.now() / 1000);
    const weekAgo = currentTime - 24 * 60 * 60 * 7;
    
    // Always try to load from cache first for immediate response
    const cacheLoaded = loadFromCache('following', weekAgo, currentTime);
    
    try {
      // If force reconnect or no relays connected, connect to relays
      const relayStatus = nostrService.getRelayStatus();
      const connectedRelays = relayStatus.filter(r => r.status === 'connected');
      
      if (forceReconnect || connectedRelays.length === 0) {
        // Connect to relays
        await nostrService.connectToUserRelays();
        setConnectionAttempted(true);
      }
      
      // Reset state when filter changes (if not loading from cache)
      if (!cacheLoaded) {
        setEvents([]);
      }
      setHasMore(true);
      
      // Reset the timestamp range for new subscription
      // Close previous subscription if exists
      // If online, start a new subscription
      if (navigator.onLine) {
        const newSubId = setupSubscription(weekAgo, currentTime);
        setSubId(newSubId);
      }
      
      if (following.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error initializing feed:", error);
      setLoading(false);
      
      // Retry up to 3 times
      setRetryCount(prev => {
        if (prev < 3) {
          setTimeout(() => initFeed(true), 2000); // Retry after 2 seconds
          return prev + 1;
        } else {
          toast.error("Failed to connect to relays. Check your connection or try again later.");
          return prev;
        }
      });
    } finally {
      setLoadingFromCache(false);
    }
  };
  
  // Refresh feed function for manual refresh
  const refreshFeed = () => {
    // Fix: Changed from passing direct number to using a callback function
    setRetryCount(prev => 0);
    setCacheHit(false);
    initFeed(true);
  };

  return {
    initFeed,
    refreshFeed
  };
}
