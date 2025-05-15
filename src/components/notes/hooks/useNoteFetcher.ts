import { useState, useCallback, useEffect } from "react";
import { Note } from "./types";
import { nostrService } from "@/lib/nostr";
import { encryption } from "@/lib/encryption";
import { toast } from "sonner";

export const useNoteFetcher = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesCollection, setNotesCollection] = useState<Note[]>([]);

  // Fetch notes from Nostr relays on component mount
  useEffect(() => {
    fetchNotesCollection();
  }, []);

  // Fetch notes with kind 30023 (NIP-23 long-form content)
  const fetchNotesCollection = async () => {
    setIsLoading(true);
    try {
      console.log("Connecting to relays to fetch notes...");
      await nostrService.connectToUserRelays();
      
      const currentPubkey = nostrService.publicKey;
      
      // Only fetch notes if user is logged in
      if (!currentPubkey) {
        console.log("User not logged in, not fetching notes from relays");
        setNotesCollection([]);
        setIsLoading(false);
        return;
      }
      
      // Subscribe to notebin events (kind 30023) only for current user
      const filters = [{ 
        kinds: [30023], 
        authors: [currentPubkey], // Only fetch notes from current user
        limit: 20 
      }];
      
      const notes: Note[] = [];
      
      // Use subscribe method instead of subscribeToEvents
      const subId = nostrService.subscribe(
        filters,
        async (event) => {
          try {
            // Extract title from tags
            const titleTag = event.tags.find(tag => tag[0] === 'title');
            let title = titleTag ? titleTag[1] : 'Untitled Note';
            
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
            
            // Check if the note is encrypted
            const encryptedTag = event.tags.find(tag => tag[0] === 'encrypted');
            const isEncrypted = encryptedTag ? encryptedTag[1] === 'true' : false;
            
            // Get encryption method if encrypted
            const encryptionMethodTag = event.tags.find(tag => tag[0] === 'encryption');
            const encryptionMethod = encryptionMethodTag ? encryptionMethodTag[1] : 'nip04';
            
            // Content to display
            let content = event.content;

            // Try to decrypt content if encrypted
            if (isEncrypted && encryptionMethod === 'nip04') {
              if (event.pubkey === nostrService.publicKey) {
                try {
                  // NIP-04 decryption (using the author's pubkey)
                  const decryptedContent = await encryption.decryptContent(content, event.pubkey);
                  if (decryptedContent) {
                    content = decryptedContent;
                  }
                  
                  // Try to decrypt title too
                  const decryptedTitle = await encryption.decryptContent(title, event.pubkey);
                  if (decryptedTitle) {
                    title = decryptedTitle;
                  }
                } catch (decryptError) {
                  console.error("Failed to decrypt note:", decryptError);
                  toast.error("Failed to decrypt note. Only the author can decrypt it.");
                  // Keep encrypted content as is
                }
              } else {
                toast.warning("This note is encrypted. Only the author can view it.");
              }
            }
            
            // Create note object
            const note: Note = {
              id: event.id,
              title,
              content,
              language,
              publishedAt: new Date(event.created_at * 1000).toISOString(),
              author: event.pubkey,
              event,
              tags: contentTags,
              slug,
              encrypted: isEncrypted
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
        setNotesCollection(notes);
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
        let title = titleTag ? titleTag[1] : 'Untitled Note';
        
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
        
        // Check if the note is encrypted
        const encryptedTag = event.tags.find(tag => tag[0] === 'encrypted');
        const isEncrypted = encryptedTag ? encryptedTag[1] === 'true' : false;
        
        // Get encryption method if encrypted
        const encryptionMethodTag = event.tags.find(tag => tag[0] === 'encryption');
        const encryptionMethod = encryptionMethodTag ? encryptionMethodTag[1] : 'nip04';
        
        // Content to display
        let content = event.content;

        // Try to decrypt content if encrypted
        if (isEncrypted && encryptionMethod === 'nip04') {
          if (event.pubkey === nostrService.publicKey) {
            try {
              // NIP-04 decryption (using the author's pubkey)
              const decryptedContent = await encryption.decryptContent(content, event.pubkey);
              if (decryptedContent) {
                content = decryptedContent;
              }
              
              // Try to decrypt title too
              const decryptedTitle = await encryption.decryptContent(title, event.pubkey);
              if (decryptedTitle) {
                title = decryptedTitle;
              }
            } catch (decryptError) {
              console.error("Failed to decrypt note:", decryptError);
              toast.error("Failed to decrypt note. Only the author can decrypt it.");
              // Keep encrypted content as is
            }
          } else {
            toast.warning("This note is encrypted. Only the author can view it.");
          }
        }
        
        const noteData: Note = {
          id: event.id,
          title,
          content,
          language,
          publishedAt: new Date(event.created_at * 1000).toISOString(),
          author: event.pubkey,
          event,
          tags: contentTags,
          slug,
          encrypted: isEncrypted
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
    notesCollection,
    isLoading,
    error,
    fetchNote,
    refreshNotes: fetchNotesCollection
  };
};
