
import { useState, useEffect, useMemo } from "react";
import { nostrService, NostrEvent, BookmarkWithMetadata, BookmarkCollection } from "@/lib/nostr";

export const useBookmarkData = () => {
  // Main state
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<NostrEvent[]>([]);
  const [bookmarkMetadata, setBookmarkMetadata] = useState<BookmarkWithMetadata[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const isLoggedIn = !!nostrService.publicKey;

  // Fetch bookmarks, collections, and metadata on mount
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    
    const fetchBookmarkData = async () => {
      try {
        // Fetch bookmarks
        const bookmarkIds = await nostrService.getBookmarks();
        setBookmarks(bookmarkIds);
        
        // Fetch collections
        const collectionsList = await nostrService.getBookmarkCollections();
        setCollections(collectionsList);
        
        // Fetch bookmark metadata
        const metadata = await nostrService.getBookmarkMetadata();
        setBookmarkMetadata(metadata);
        
        if (bookmarkIds.length === 0) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching bookmark data:", error);
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
        await nostrService.connectToUserRelays();
        
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
        }, 5000);
        
        return () => {
          nostrService.unsubscribe(subId);
        };
      } catch (error) {
        console.error("Error fetching bookmarked events:", error);
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [bookmarks]);

  // Function to fetch profile data
  const fetchProfileData = (pubkey: string) => {
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
    }, 3000);
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

  // Handle creating a new collection
  const createCollection = async (
    name: string,
    color: string,
    description: string
  ): Promise<string | null> => {
    if (!name.trim()) {
      return null;
    }
    
    try {
      const collectionId = await nostrService.createBookmarkCollection(
        name.trim(),
        color,
        description.trim() || undefined
      );
      
      if (collectionId) {
        // Refresh collections
        const updatedCollections = await nostrService.getBookmarkCollections();
        setCollections(updatedCollections);
        return collectionId;
      }
      return null;
    } catch (error) {
      console.error("Error creating collection:", error);
      return null;
    }
  };

  return {
    bookmarks,
    bookmarkedEvents,
    bookmarkMetadata,
    collections,
    profiles,
    loading,
    isLoggedIn,
    allTags,
    createCollection
  };
};
