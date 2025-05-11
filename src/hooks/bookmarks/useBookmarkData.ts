
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { BookmarkCollection, BookmarkWithMetadata } from "@/lib/nostr/bookmark";
import { extractTagsFromEvent } from "@/lib/nostr/bookmark/utils/bookmark-utils";

type NetworkStatus = 'online' | 'offline' | 'limited';

interface UseBookmarkDataResult {
  bookmarkedEvents: any[];
  bookmarkMetadata: BookmarkWithMetadata[];
  collections: BookmarkCollection[];
  profiles: Record<string, any>;
  loading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  allTags: string[];
  networkStatus: NetworkStatus;
  createCollection: (name: string, color: string, description: string) => Promise<string | null>;
  refreshBookmarks: () => Promise<void>;
}

export function useBookmarkData(): UseBookmarkDataResult {
  const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);
  const [bookmarkMetadata, setBookmarkMetadata] = useState<BookmarkWithMetadata[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(navigator.onLine ? 'online' : 'offline');
  
  const isLoggedIn = !!nostrService.publicKey;

  // Function to create a new collection
  const createCollection = useCallback(async (
    name: string,
    color: string,
    description: string
  ): Promise<string | null> => {
    if (!isLoggedIn) {
      toast.error("You must be logged in to create collections");
      return null;
    }
    
    try {
      return await nostrService.createBookmarkCollection(name, color, description);
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }, [isLoggedIn]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load bookmarks and related data
  const loadBookmarkData = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check relay connection status before proceeding
      const relayStatus = nostrService.getRelayStatus();
      const connectedCount = relayStatus.filter(r => r.status === 'connected').length;
      
      // Try to connect if not connected yet
      if (connectedCount === 0 && navigator.onLine) {
        try {
          await nostrService.connectToUserRelays();
          const updatedStatus = nostrService.getRelayStatus();
          const newConnectedCount = updatedStatus.filter(r => r.status === 'connected').length;
          
          if (newConnectedCount === 0) {
            setNetworkStatus('limited');
          }
        } catch (error) {
          console.error("Failed to connect to relays:", error);
          setNetworkStatus('limited');
        }
      }
      
      // Get bookmark IDs
      const bookmarkIds = await nostrService.getBookmarks(true);
      
      if (bookmarkIds.length === 0) {
        setBookmarkedEvents([]);
        setLoading(false);
        return;
      }
      
      // Get bookmark metadata
      const metadata = await nostrService.getBookmarkMetadata(true);
      setBookmarkMetadata(metadata);
      
      // Get bookmark collections
      const bookmarkCollections = await nostrService.getBookmarkCollections(true);
      setCollections(bookmarkCollections);
      
      // Load the actual events
      if (bookmarkIds.length > 0) {
        // Get events for all bookmarked IDs
        const events = await nostrService.getEvents(bookmarkIds);
        setBookmarkedEvents(events.filter(Boolean));
        
        // Extract unique pubkeys for profile data
        const pubkeys = Array.from(new Set(events.map(event => event?.pubkey).filter(Boolean)));
        
        if (pubkeys.length > 0) {
          // Get profile data for all authors
          const profileData = await nostrService.getProfilesByPubkeys(pubkeys);
          setProfiles(profileData);
        }
        
        // Extract all unique tags from events and metadata
        const eventTags = events.flatMap(event => extractTagsFromEvent(event));
        const metadataTags = metadata.flatMap(meta => meta.tags || []);
        setAllTags(Array.from(new Set([...eventTags, ...metadataTags])));
      }
    } catch (err) {
      console.error("Error loading bookmarks:", err);
      setError("Failed to load bookmarks. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // Refresh bookmarks data
  const refreshBookmarks = useCallback(async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    
    try {
      // Try to connect to relays if not connected
      if (networkStatus !== 'online') {
        try {
          await nostrService.connectToUserRelays();
          setNetworkStatus('online');
        } catch (error) {
          console.error("Failed to connect during refresh:", error);
        }
      }
      
      // Reload all data
      await loadBookmarkData();
      
      // Process any pending operations
      await nostrService.processPendingOperations();
    } catch (error) {
      console.error("Error refreshing bookmarks:", error);
      setError("Failed to refresh bookmarks");
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, networkStatus, loadBookmarkData]);

  // Initial data load
  useEffect(() => {
    if (isLoggedIn) {
      loadBookmarkData();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, loadBookmarkData]);

  return {
    bookmarkedEvents,
    bookmarkMetadata,
    collections,
    profiles,
    loading,
    error,
    isLoggedIn,
    allTags,
    networkStatus,
    createCollection,
    refreshBookmarks
  };
}
