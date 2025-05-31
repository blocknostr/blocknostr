import { useState, useCallback, useEffect, useRef } from "react";
import { Note } from "./types";
import { nostrService } from "@/lib/nostr";
import { encryption } from "@/utils/encryption";
import { toast } from "@/lib/toast";

export const useNoteFetcher = () => {
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notebinNotes, setNotebinNotes] = useState<Note[]>([]);
  
  // ✅ Connection management state
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const activeSubscriptionRef = useRef<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ Debounce configuration
  const DEBOUNCE_DELAY = 1000; // 1 second
  const MIN_FETCH_INTERVAL = 5000; // 5 seconds between fetches
  const SUBSCRIPTION_TIMEOUT = 5000; // 5 seconds to wait for events

  // ✅ Cleanup function
  const cleanup = useCallback(() => {
    if (activeSubscriptionRef.current) {
      console.log('[useNoteFetcher] Cleaning up active subscription:', activeSubscriptionRef.current);
      nostrService.unsubscribe(activeSubscriptionRef.current);
      activeSubscriptionRef.current = null;
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    isFetchingRef.current = false;
  }, []);

  // ✅ Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // ✅ FIXED: Stabilize the fetchNotebinNotes function to prevent recreation
  const fetchNotebinNotesStable = useCallback(async () => {
    // ✅ Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('[useNoteFetcher] Fetch already in progress, skipping...');
      return;
    }

    // ✅ Rate limiting - prevent fetches too close together
    const now = Date.now();
    if (now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      console.log('[useNoteFetcher] Rate limited, skipping fetch...');
      return;
    }
    
    const currentPubkey = nostrService.publicKey;
    
    // Only fetch notes if user is logged in
    if (!currentPubkey) {
      console.log("[useNoteFetcher] User not logged in, not fetching notes from relays");
      setNotebinNotes([]);
      setIsLoading(false);
      return;
    }

    // ✅ Set flags and track timing
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("[useNoteFetcher] Connecting to relays to fetch notebin notes...");
      
      // ✅ Check if we're already connected to reduce connection spam
      const connectedRelays = nostrService.getConnectedRelays?.() || [];
      if (connectedRelays.length === 0) {
        await nostrService.connectToUserRelays();
      }
      
      // ✅ Cleanup any existing subscription before creating new one
      if (activeSubscriptionRef.current) {
        nostrService.unsubscribe(activeSubscriptionRef.current);
        activeSubscriptionRef.current = null;
      }
      
      // Subscribe to notebin events (kind 30023) only for current user
      const filters = [{ 
        kinds: [30023], 
        authors: [currentPubkey], // Only fetch notes from current user
        limit: 20 
      }];
      
      const notes: Note[] = [];
      let subscriptionClosed = false;
      
      // ✅ Create subscription with improved event handling
      const subId = nostrService.subscribe(
        filters,
        async (event) => {
          if (subscriptionClosed) return; // Ignore events if subscription was closed
          
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
                // NIP-04 decryption (using the author's pubkey)
                const decryptedContent = await encryption.decryptContent(content, event.pubkey);
                if (decryptedContent) {
                  content = decryptedContent;
                } else {
                  // Decryption failed - check if we should show info to user
                  if (!encryption.isNip04Available() && !sessionStorage.getItem('nip04-info-shown')) {
                    toast.info(encryption.getNip04StatusMessage());
                    sessionStorage.setItem('nip04-info-shown', 'true');
                  }
                  // Mark content as encrypted
                  content = "[Encrypted content - install Nostr extension to decrypt]";
                }
                
                // Try to decrypt title too
                const decryptedTitle = await encryption.decryptContent(title, event.pubkey);
                if (decryptedTitle) {
                  title = decryptedTitle;
                } else if (!encryption.isNip04Available()) {
                  title = "[Encrypted] " + title;
                }
              } else {
                // Not the author - show warning only once per session
                if (!sessionStorage.getItem('encryption-warning-shown')) {
                  toast.warning("Some notes are encrypted and can only be viewed by their authors.");
                  sessionStorage.setItem('encryption-warning-shown', 'true');
                }
                // Mark note as encrypted but viewable
                content = "[Encrypted content - only viewable by author]";
              }
            }
            
            // ✅ Prevent duplicate notes
            const existingNote = notes.find(n => n.id === event.id);
            if (!existingNote) {
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
            }
          } catch (err) {
            console.error("[useNoteFetcher] Error parsing note event:", err);
          }
        }
      );
      
      // ✅ Store active subscription reference
      activeSubscriptionRef.current = subId;
      
      // ✅ Wait for events with proper cleanup
      setTimeout(() => {
        if (activeSubscriptionRef.current === subId) {
          subscriptionClosed = true;
          nostrService.unsubscribe(subId);
          activeSubscriptionRef.current = null;
          
          // ✅ Sort notes by creation time (newest first)
          const sortedNotes = notes.sort((a, b) => 
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
          );
          
          setNotebinNotes(sortedNotes);
          console.log(`[useNoteFetcher] Fetched ${sortedNotes.length} notes from relays`);
        }
        
        setIsLoading(false);
        isFetchingRef.current = false;
      }, SUBSCRIPTION_TIMEOUT);
      
    } catch (error) {
      console.error("[useNoteFetcher] Error fetching notes from relays:", error);
      setError("Failed to fetch notes from relays");
      setIsLoading(false);
      isFetchingRef.current = false;
      
      // ✅ Cleanup on error
      if (activeSubscriptionRef.current) {
        nostrService.unsubscribe(activeSubscriptionRef.current);
        activeSubscriptionRef.current = null;
      }
    }
  }, []); // ✅ FIXED: No dependencies to prevent recreation

  // ✅ FIXED: Use a ref to track if initial fetch has been done
  const initialFetchDoneRef = useRef(false);

  // ✅ FIXED: Debounced fetch notes function - now stable
  const debouncedFetchNotes = useCallback(() => {
    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchNotebinNotesStable();
    }, DEBOUNCE_DELAY);
  }, [fetchNotebinNotesStable]);

  // ✅ FIXED: Use debounced fetch on mount only once
  useEffect(() => {
    if (!initialFetchDoneRef.current) {
      initialFetchDoneRef.current = true;
      debouncedFetchNotes();
    }
  }, []); // ✅ Empty dependencies to run only once

  const fetchNote = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // ✅ Check if we're already connected to reduce connection spam
      const connectedRelays = nostrService.getConnectedRelays?.() || [];
      if (connectedRelays.length === 0) {
        await nostrService.connectToUserRelays();
      }
      
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
            // NIP-04 decryption (using the author's pubkey)
            const decryptedContent = await encryption.decryptContent(content, event.pubkey);
            if (decryptedContent) {
              content = decryptedContent;
            } else {
              // Decryption failed - check if we should show info to user
              if (!encryption.isNip04Available() && !sessionStorage.getItem('nip04-info-shown')) {
                toast.info(encryption.getNip04StatusMessage());
                sessionStorage.setItem('nip04-info-shown', 'true');
              }
              // Mark content as encrypted
              content = "[Encrypted content - install Nostr extension to decrypt]";
            }
            
            // Try to decrypt title too
            const decryptedTitle = await encryption.decryptContent(title, event.pubkey);
            if (decryptedTitle) {
              title = decryptedTitle;
            } else if (!encryption.isNip04Available()) {
              title = "[Encrypted] " + title;
            }
          } else {
            // Not the author - show warning only once per session
            if (!sessionStorage.getItem('encryption-warning-shown')) {
              toast.warning("Some notes are encrypted and can only be viewed by their authors.");
              sessionStorage.setItem('encryption-warning-shown', 'true');
            }
            // Mark note as encrypted but viewable
            content = "[Encrypted content - only viewable by author]";
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
      console.error("[useNoteFetcher] Error fetching note:", error);
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
    refreshNotes: fetchNotebinNotesStable
  };
};

