
import { useState, useCallback, useEffect } from "react";
import { Note } from "./types";
import { nostrService } from "@/lib/nostr";

export const useNoteFetcher = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notebinNotes, setNotebinNotes] = useState<Note[]>([]);

  // Fetch notes from Nostr relays on component mount
  useEffect(() => {
    fetchNotebinNotes();
  }, []);

  // Fetch notes with kind 30023 (NIP-23 long-form content)
  const fetchNotebinNotes = async () => {
    setIsLoading(true);
    try {
      console.log("Connecting to relays to fetch notebin notes...");
      await nostrService.connectToUserRelays();
      
      // Subscribe to notebin events (kind 30023)
      const filters = [{ kinds: [30023], limit: 20 }];
      
      const notes: Note[] = [];
      
      // Use subscribe method instead of subscribeToEvents
      const subId = nostrService.subscribe(
        filters,
        (event) => {
          try {
            // Extract title from tags
            const titleTag = event.tags.find(tag => tag[0] === 'title');
            const title = titleTag ? titleTag[1] : 'Untitled Note';
            
            // Extract language from tags
            const langTag = event.tags.find(tag => tag[0] === 'language');
            const language = langTag ? langTag[1] : 'text';
            
            // Extract tags
            const contentTags = event.tags
              .filter(tag => tag.length >= 2 && tag[0] === 't')
              .map(tag => tag[1]);
            
            // Extract slug
            const slugTag = event.tags.find(tag => tag[0] === 'slug');
            const slug = slugTag ? slugTag[1] : '';
            
            // Create note object
            const note: Note = {
              id: event.id,
              title,
              content: event.content,
              language,
              publishedAt: new Date(event.created_at * 1000).toISOString(),
              author: event.pubkey,
              event,
              tags: contentTags,
              slug
            };
            
            notes.push(note);
          } catch (err) {
            console.error("Error parsing note event:", err);
          }
        }
      );
      
      // Wait for events to be received (3 second timeout)
      setTimeout(() => {
        nostrService.unsubscribe(subId);
        setNotebinNotes(notes);
        setIsLoading(false);
        console.log(`Fetched ${notes.length} notes from relays`);
      }, 3000);
      
    } catch (error) {
      console.error("Error fetching notes from relays:", error);
      setError("Failed to fetch notes from relays");
      setIsLoading(false);
    }
  };

  const fetchNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await nostrService.connectToUserRelays();
      
      const event = await nostrService.getEventById(id);
      if (event) {
        // Extract title from tags
        const titleTag = event.tags.find(tag => tag[0] === 'title');
        const title = titleTag ? titleTag[1] : 'Untitled Note';
        
        // Extract language from tags
        const langTag = event.tags.find(tag => tag[0] === 'language');
        const language = langTag ? langTag[1] : 'text';
        
        // Extract tags
        const contentTags = event.tags
          .filter(tag => tag[0] === 't')
          .map(tag => tag[1]);
        
        // Extract slug
        const slugTag = event.tags.find(tag => tag[0] === 'slug');
        const slug = slugTag ? slugTag[1] : '';
        
        const noteData: Note = {
          id: event.id,
          title,
          content: event.content,
          language,
          publishedAt: new Date(event.created_at * 1000).toISOString(),
          author: event.pubkey,
          event: event,
          tags: contentTags,
          slug
        };
        setNote(noteData);
      } else {
        setError("Note not found");
        setNote(null);
      }
    } catch (error) {
      setError("Failed to fetch note");
      console.error("Error fetching note:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    note,
    notebinNotes,
    isLoading,
    error,
    fetchNote,
    refreshNotes: fetchNotebinNotes
  };
};
