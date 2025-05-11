
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { nostrService, NostrEvent, BookmarkWithMetadata, BookmarkCollection } from "@/lib/nostr";
import { retry } from "@/lib/utils/retry";
import { BookmarkCacheService } from "@/lib/nostr/bookmark/cache/bookmark-cache-service";

export const useBookmarkData = () => {
  // Main state
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<NostrEvent[]>([]);
  const [bookmarkMetadata, setBookmarkMetadata] = useState<BookmarkWithMetadata[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'limited'>(
    navigator.onLine ? 'online' : 'offline'
  );
  
  const isLoggedIn = !!nostrService.publicKey;

  // Handle online/offline status
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

  // Fetch bookmarks, collections, and metadata on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    const fetchBookmarkData = async () => {
      setError(null);
      setLoading(true);
      
      try {
        // Try to load from cache first
        const cachedBookmarks = await BookmarkCacheService.getCachedBookmarkList();
        const cachedMetadata = await BookmarkCacheService.getCachedBookmarkMetadata();
        const cachedCollections = await BookmarkCacheService.getCachedBookmarkCollections();
        
        // If we have cached data, show it immediately while we fetch fresh data
        if (cachedBookmarks.length > 0) {
          setBookmarks(cachedBookmarks);
        }
        
        if (cachedMetadata.length > 0) {
          setBookmarkMetadata(cachedMetadata);
        }
        
        if (cachedCollections.length > 0) {
          setCollections(cachedCollections);
        }
        
        // If we're offline and have cache, don't try to fetch from network
        if (!navigator.onLine && (cachedBookmarks.length > 0 || cachedMetadata.length > 0 || cachedCollections.length > 0)) {
          console.log("Using cached bookmark data (offline mode)");
          setNetworkStatus('offline');
          setLoading(false);
          return;
        }
        
        // Fetch from network if online
        if (navigator.onLine) {
          try {
            // Fetch bookmarks with retry logic
            const bookmarkIds = await retry(
              () => nostrService.getBookmarks(),
              {
                maxAttempts: 3,
                baseDelay: 1000,
                onRetry: (attempt) => console.log(`Retrying getBookmarks (${attempt}/3)...`)
              }
            );
            setBookmarks(bookmarkIds);
            
            // Cache the results
            await BookmarkCacheService.cacheBookmarkList(bookmarkIds);
            
            // Fetch collections with retry logic
            const collectionsList = await retry(
              () => nostrService.getBookmarkCollections(),
              {
                maxAttempts: 3,
                baseDelay: 1000,
                onRetry: (attempt) => console.log(`Retrying getBookmarkCollections (${attempt}/3)...`)
              }
            );
            setCollections(collectionsList);
            
            // Cache the collections
            await BookmarkCacheService.cacheBookmarkCollections(collectionsList);
            
            // Fetch bookmark metadata with retry logic
            const metadata = await retry(
              () => nostrService.getBookmarkMetadata(),
              {
                maxAttempts: 3,
                baseDelay: 1000,
                onRetry: (attempt) => console.log(`Retrying getBookmarkMetadata (${attempt}/3)...`)
              }
            );
            setBookmarkMetadata(metadata);
            
            // Cache the metadata
            await BookmarkCacheService.cacheBookmarkMetadata(metadata);
          } catch (e) {
            console.error("Error fetching from network:", e);
            
            // If network fetch failed but we have cache, we're in limited connectivity mode
            if (cachedBookmarks.length > 0 || cachedMetadata.length > 0 || cachedCollections.length > 0) {
              setNetworkStatus('limited');
              toast.warning("Using cached bookmark data due to connection issues");
            } else {
              setError("Failed to load bookmarks. Please check your connection.");
              toast.error("Failed to load bookmarks");
            }
          }
        }
        
        if (bookmarks.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in fetchBookmarkData:", error);
        setError("An error occurred while loading bookmarks");
        toast.error("Failed to load bookmarks");
        setLoading(false);
      }
    };
    
    fetchBookmarkData();
  }, [isLoggedIn]);
  
  // Fetch bookmarked events
  useEffect(() => {
    if (bookmarks.length === 0) return;
    
    const fetchEvents = async () => {
      try {
        // Connect to relays with retry mechanism
        await retry(
          () => nostrService.connectToUserRelays(),
          { 
            maxAttempts: 3,
            baseDelay: 1000,
            onRetry: (attempt) => console.log(`Retrying relay connection (${attempt}/3)...`)
          }
        );
        
        const subId = nostrService.subscribe(
          [
            {
              ids: bookmarks,
              kinds: [1], // Regular notes
            }
          ],
          (event) => {
            setBookmarkedEvents(prev => {
              if (prev.some(e => e.id === event.id)) {
                return prev;
              }
              return [...prev, event];
            });
            
            // Fetch profile data for this event
            if (event.pubkey && !profiles[event.pubkey]) {
              fetchProfileData(event.pubkey);
            }
          }
        );
        
        // Set a timeout to close the subscription
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setLoading(false);
        }, 10000); // Increased from 5000 for better reliability
        
        return () => {
          nostrService.unsubscribe(subId);
        };
      } catch (error) {
        console.error("Error fetching bookmarked events:", error);
        setLoading(false);
        
        // Show error message if we don't have any events yet
        if (bookmarkedEvents.length === 0) {
          toast.error("Failed to fetch bookmarked posts");
          setError("Failed to fetch bookmarked posts");
        }
      }
    };
    
    fetchEvents();
  }, [bookmarks]);

  // Function to fetch profile data with retry logic
  const fetchProfileData = async (pubkey: string) => {
    try {
      const metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            setProfiles(prev => ({
              ...prev,
              [pubkey]: metadata
            }));
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(metadataSubId);
      }, 5000);
    } catch (e) {
      console.error(`Error fetching profile for ${pubkey}:`, e);
    }
  };

  // Get all unique tags from bookmarks
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    bookmarkMetadata.forEach(meta => {
      if (meta.tags?.length) {
        meta.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet);
  }, [bookmarkMetadata]);

  // Handle creating a new collection with retry logic
  const createCollection = async (
    name: string,
    color: string,
    description: string
  ): Promise<string | null> => {
    if (!name.trim()) {
      return null;
    }
    
    try {
      const collectionId = await retry(
        () => nostrService.createBookmarkCollection(
          name.trim(),
          color,
          description.trim() || undefined
        ),
        {
          maxAttempts: 3,
          onRetry: (attempt) => console.log(`Retrying createBookmarkCollection (${attempt}/3)...`)
        }
      );
      
      if (collectionId) {
        // Refresh collections with retry logic
        const updatedCollections = await retry(
          () => nostrService.getBookmarkCollections(),
          {
            maxAttempts: 2,
            onRetry: (attempt) => console.log(`Retrying getBookmarkCollections after creation (${attempt}/2)...`)
          }
        );
        
        setCollections(updatedCollections);
        
        // Update cache
        await BookmarkCacheService.cacheBookmarkCollections(updatedCollections);
        
        return collectionId;
      }
      return null;
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection. Please try again.");
      return null;
    }
  };
  
  // Function to manually refresh bookmarks
  const refreshBookmarks = async () => {
    if (!isLoggedIn) return;
    
    setLoading(true);
    toast.loading("Refreshing bookmarks...");
    
    try {
      // Fetch bookmarks with fresh data
      const bookmarkIds = await nostrService.getBookmarks();
      setBookmarks(bookmarkIds);
      
      // Cache the results
      await BookmarkCacheService.cacheBookmarkList(bookmarkIds);
      
      // Reset bookmarked events to fetch fresh data
      setBookmarkedEvents([]);
      
      // Fetch fresh collections and metadata
      const collectionsList = await nostrService.getBookmarkCollections();
      const metadata = await nostrService.getBookmarkMetadata();
      
      setCollections(collectionsList);
      setBookmarkMetadata(metadata);
      
      // Update caches
      await BookmarkCacheService.cacheBookmarkCollections(collectionsList);
      await BookmarkCacheService.cacheBookmarkMetadata(metadata);
      
      toast.success("Bookmarks refreshed");
      setNetworkStatus('online');
      setError(null);
    } catch (error) {
      console.error("Error refreshing bookmarks:", error);
      toast.error("Failed to refresh bookmarks");
      setError("Failed to refresh bookmarks");
    } finally {
      setLoading(false);
    }
  };

  return {
    bookmarks,
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
};
