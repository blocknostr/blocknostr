
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface UseFeedInitializationProps {
  loadFromCache: (feedType: string, since?: number, until?: number) => boolean;
  setupSubscription: (since: number, until?: number) => string | null;
  setSubId: React.Dispatch<React.SetStateAction<string | null>>;
  setEvents: React.Dispatch<React.SetStateAction<any[]>>;
  setHasMore: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setCacheHit: React.Dispatch<React.SetStateAction<boolean>>;
  setLoadingFromCache: React.Dispatch<React.SetStateAction<boolean>>;
  following: string[];
  subId: string | null;
}

export function useFeedInitialization({
  loadFromCache,
  setupSubscription,
  setSubId,
  setEvents,
  setHasMore,
  setLoading,
  setCacheHit,
  setLoadingFromCache,
  following,
  subId
}: UseFeedInitializationProps) {
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
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
      
      // Close previous subscription if exists
      if (subId) {
        nostrService.unsubscribe(subId);
      }
      
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
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => initFeed(true), 2000); // Retry after 2 seconds
      } else {
        toast.error("Failed to connect to relays. Check your connection or try again later.");
      }
    } finally {
      setLoadingFromCache(false);
    }
  };
  
  // Refresh feed function for manual refresh
  const refreshFeed = () => {
    setRetryCount(0);
    setCacheHit(false);
    initFeed(true);
  };
  
  return {
    initFeed,
    refreshFeed,
    connectionAttempted,
    retryCount
  };
}
