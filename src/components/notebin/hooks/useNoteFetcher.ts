import { useState, useCallback } from "react";
import { Note } from "./types";
import { nostrService } from "@/lib/nostr";

export const useNoteFetcher = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the correct method name
      await nostrService.connectToUserRelays();
      
      const event = await nostrService.getEventById(id);
      if (event) {
        // Basic parsing, adjust as needed
        const noteData: Note = {
          id: event.id,
          title: event.content.substring(0, 50), // Example: first 50 chars as title
          content: event.content,
          language: "text", // Example default
          publishedAt: new Date(event.created_at * 1000).toISOString(),
          author: event.pubkey,
          event: event,
          tags: event.tags.map(tag => tag[0]) // Example: extract first element of each tag
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
    isLoading,
    error,
    fetchNote,
  };
};
