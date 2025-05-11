
import { useState } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useHotkeys } from "../useHotkeys";
import { Note } from "../hooks/types";

export function useNoteEditorState(onNoteSaved: (note: Note) => void) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  // Register keyboard shortcuts
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    if (canSave()) handleSave();
  }, [title, content, isSaving]);
  
  useHotkeys('ctrl+p', (e) => {
    e.preventDefault();
    togglePreview();
  }, [previewMode]);
  
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  const canSave = () => {
    return !isSaving && !!title && !!content;
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content");
      return;
    }

    setIsSaving(true);

    try {
      console.log("Starting note save process");
      
      // Generate a unique ID for the note if one doesn't exist
      const uniqueId = noteId || `notebin-${Math.random().toString(36).substring(2, 10)}`;
      
      // Use current timestamp for publishedAt
      const publishedAt = new Date().toISOString();
      
      // Create a new event object
      const event = {
        kind: 30023,
        content: content,
        tags: [
          ["title", title],
          ["language", language],
          ["published_at", Math.floor(Date.now() / 1000).toString()],
          ["d", uniqueId] // Unique identifier
        ]
      };
      
      // Add user tags to the note
      tags.forEach(tag => {
        event.tags.push(["t", tag]); // Using "t" as per NIP-12 for tags
      });

      let eventId = uniqueId;
      
      // Only publish to Nostr if user is logged in
      if (nostrService.publicKey) {
        console.log("User is logged in, publishing to Nostr");
        const publishedId = await nostrService.publishEvent(event);
        if (publishedId) {
          eventId = publishedId;
          console.log("Published to Nostr with ID:", publishedId);
        }
      } else {
        console.log("User not logged in, saving locally only");
      }

      // Create the note object with consistent structure
      const newNote: Note = {
        id: eventId,
        title,
        language,
        content,
        tags,
        publishedAt,
        author: nostrService.publicKey || 'local-user',
        event
      };
      
      console.log("Calling onNoteSaved with note:", newNote);
      
      // Save to the parent component's state
      onNoteSaved(newNote);
      
      // Update the local state
      setNoteId(eventId);
      
      toast.success("Note saved successfully!");
      
      // Clear form if it's a new note
      if (!noteId) {
        clearEditor();
      }
      
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Content copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  const shareNote = () => {
    if (!noteId) {
      toast.error("You need to save the note first before sharing");
      return;
    }
    
    const shareUrl = `${window.location.origin}/notebin?note=${noteId}`;
    
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        toast.success("Share link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy share link");
      });
  };

  const clearEditor = () => {
    setTitle("");
    setContent("");
    setLanguage("text");
    setNoteId(null);
    setTags([]);
    setPreviewMode(false);
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    language,
    setLanguage,
    isSaving,
    noteId,
    tags,
    setTags,
    previewMode,
    togglePreview,
    canSave,
    handleSave,
    copyToClipboard,
    shareNote,
    clearEditor,
    isLoggedIn: !!nostrService.publicKey
  };
}
