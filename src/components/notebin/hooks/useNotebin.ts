
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNotebinFilter } from "@/hooks/useNotebinFilter";

interface Note {
  id: string;
  title: string;
  content: string;
  language: string;
  publishedAt: string;
  author: string;
  event: any;
  tags?: string[];
}

export function useNotebin() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [tags, setTags] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // Use our custom hook for filtering
  const { availableTags, filteredNotes } = useNotebinFilter(savedNotes, selectedTags);

  // Handle tag toggling for filtering
  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };
  
  // Fetch saved notebins when the page loads
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

  const handleDelete = async () => {
    if (!noteToDelete) return;

    if (!nostrService.publicKey) {
      toast.error("You must be logged in to delete notes");
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Find the note to be deleted
      const noteToDeleteObj = savedNotes.find(note => note.id === noteToDelete);
      
      if (!noteToDeleteObj) {
        throw new Error("Note not found");
      }
      
      // Check if user is the author of the note
      if (noteToDeleteObj.author !== nostrService.publicKey) {
        toast.error("You can only delete your own notes");
        setIsDeleting(false);
        return;
      }
      
      // Create a deletion event (NIP-09)
      const deletionEvent = {
        kind: 5, // Event deletion
        content: "Deleted notebin",
        tags: [
          ["e", noteToDelete] // Reference to the event being deleted
        ]
      };
      
      const deletionEventId = await nostrService.publishEvent(deletionEvent);
      
      if (deletionEventId) {
        // Remove the note from the local state
        setSavedNotes(prev => prev.filter(note => note.id !== noteToDelete));
        
        toast.success("Note deleted successfully!");
      } else {
        throw new Error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note. Please try again.");
    } finally {
      setIsDeleting(false);
      setNoteToDelete(null);
    }
  };

  const handleNoteSaved = (newNote: any) => {
    setSavedNotes(prev => [newNote, ...prev]);
  };

  const viewNote = (note: any) => {
    setTitle(note.title);
    setContent(note.content);
    setLanguage(note.language || "text");
    setTags(note.tags || []);
  };

  return {
    savedNotes,
    filteredNotes,
    isLoading,
    title,
    content,
    language,
    tags,
    availableTags,
    selectedTags,
    noteToDelete,
    isDeleting,
    isLoggedIn: !!nostrService.publicKey,
    handleTagToggle,
    handleDelete,
    handleNoteSaved,
    viewNote,
    setNoteToDelete
  };
}
