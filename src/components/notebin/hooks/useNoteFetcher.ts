import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { Note } from "./types";

export function useNoteFetcher() {
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  // Fetch saved notebins when the hook is initialized
  useEffect(() => {
    const fetchSavedNotes = async () => {
      if (!nostrService.publicKey) {
        // If user is not logged in, don't fetch notes
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Connect to relays if not already connected
        await nostrService.connectToDefaultRelays();
        
        // Query for kind 30023 events (NIP-23 long-form content)
        // Only fetch notes created by the current user
        const filter = {
          kinds: [30023],
          authors: [nostrService.publicKey],
          limit: 20
        };
        
        // Use subscribe to fetch events
        const subId = nostrService.subscribe([filter], (event) => {
          console.log("Received event:", event);
          
          // Extract title from tags
          const titleTag = event.tags.find(tag => tag[0] === 'title');
          const title = titleTag ? titleTag[1] : 'Untitled Note';
          
          // Extract language from tags
          const langTag = event.tags.find(tag => tag[0] === 'language');
          const language = langTag ? langTag[1] : 'text';
          
          // Extract published date
          const publishedTag = event.tags.find(tag => tag[0] === 'published_at');
          const publishedAt = publishedTag 
            ? new Date(parseInt(publishedTag[1]) * 1000).toLocaleString() 
            : new Date(event.created_at * 1000).toLocaleString();
            
          // Extract tags from event
          const tagList = event.tags
            .filter(tag => tag[0] === 't' && tag.length >= 2)
            .map(tag => tag[1]);
            
          const note = {
            id: event.id,
            title,
            language,
            content: event.content,
            tags: tagList,
            publishedAt,
            author: event.pubkey,
            event
          };
          
          // Add to saved notes if not already there
          setSavedNotes(prev => {
            if (prev.some(n => n.id === note.id)) {
              return prev;
            }
            return [note, ...prev];
          });

          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        });
        
        // Unsubscribe after a short time to avoid continuous updates
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setIsLoading(false);
        }, 5000);
      } catch (error) {
        console.error("Error fetching saved notes:", error);
        toast.error("Failed to fetch saved notes");
        setIsLoading(false);
      }
    };

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
      }, 5000);
    };

    fetchSavedNotes();
  }, []);

  const handleNoteSaved = (newNote: Note) => {
    setSavedNotes(prev => [newNote, ...prev]);
  };

  return {
    savedNotes,
    setSavedNotes,
    isLoading,
    profiles,
    handleNoteSaved
  };
}
