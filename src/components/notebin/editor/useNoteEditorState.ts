import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { nostrService } from "@/lib/nostr";
import { useHotkeys } from "../useHotkeys";
import { Note } from "../hooks/types";
import { encryption } from "@/utils/encryption";

export function useNoteEditorState(onNoteSaved: (note: Note) => void) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [hasSetPassword, setHasSetPassword] = useState<boolean>(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  
  // Generate and store a local encryption key if needed, handling storage errors gracefully
  useEffect(() => {
    try {
      // First try to get existing key
      const existingKey = localStorage.getItem('notebin_encryption_key');
      if (existingKey) {
        setEncryptionKey(existingKey);
        return;
      }
      
      // Generate new key if needed
      const key = encryption.generateEncryptionKey();
      setEncryptionKey(key);
      
      // Attempt to save to localStorage, but don't fail if it can't be saved
      try {
        localStorage.setItem('notebin_encryption_key', key);
      } catch (storageError) {
        console.warn("Could not save encryption key to localStorage, using in-memory key instead:", storageError);
        // We can still use the key in-memory during this session
      }
    } catch (error) {
      console.error("Error managing encryption key:", error);
      // We'll continue without encryption
    }
  }, []);
  
  // Register keyboard shortcuts
  useHotkeys('ctrl+s', (e) => {
    e.preventDefault();
    if (canSave()) handleSave();
  }, [title, content, isSaving]);
  
  useHotkeys('ctrl+p', (e) => {
    e.preventDefault();
    togglePreview();
  }, [previewMode]);
  
  useHotkeys('ctrl+e', (e) => {
    e.preventDefault();
    toggleEncryption();
  }, [isEncrypted]);
  
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  const toggleEncryption = () => {
    // If turning encryption on, check if logged in or has password
    if (!isEncrypted) {
      if (!nostrService.publicKey && !hasSetPassword) {
        // Prompt for password if not logged in
        const pwd = prompt("Enter an encryption password for local notes:");
        if (pwd) {
          setPassword(pwd);
          setHasSetPassword(true);
          setIsEncrypted(true);
          toast.success("Encryption enabled with password");
        }
      } else {
        setIsEncrypted(true);
        toast.success("Encryption enabled");
      }
    } else {
      setIsEncrypted(false);
      toast.success("Encryption disabled");
    }
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
      const timestampSeconds = Math.floor(Date.now() / 1000).toString();
      
      // Generate a slug from the title
      const slug = title.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      
      // Process the content for encryption if needed
      let processedContent = content;
      let processedTitle = title;
      let encryptionMetadata = null;
      
      if (isEncrypted) {
        // Encrypt the content and title
        if (nostrService.publicKey) {
          // Use NIP-04 encryption
          processedContent = await encryption.encryptContent(content) || content;
          processedTitle = await encryption.encryptContent(title) || title;
        } else if (hasSetPassword) {
          // Use password-based encryption for local notes
          const encryptedContent = await encryption.encryptWithPassword(content, password);
          const encryptedTitle = await encryption.encryptWithPassword(title, password);
          
          if (encryptedContent && encryptedTitle) {
            processedContent = encryptedContent.encrypted;
            processedTitle = encryptedTitle.encrypted;
            encryptionMetadata = {
              contentSalt: encryptedContent.salt,
              titleSalt: encryptedTitle.salt,
              method: 'password'
            };
          } else {
            toast.error("Failed to encrypt content");
            setIsSaving(false);
            return;
          }
        }
      }
      
      // Create a new event object with NIP-23 specific tags
      const event = {
        kind: 30023, // NIP-23 long-form content
        content: processedContent,
        tags: [
          ["title", processedTitle],
          ["language", language],
          ["published_at", timestampSeconds],
          ["d", uniqueId], // Unique identifier (NIP-33 parameterized replaceable event)
        ]
      };
      
      // Add encryption flag if needed
      if (isEncrypted) {
        event.tags.push(["encrypted", "true"]);
        
        // Store encryption method
        event.tags.push(["encryption", nostrService.publicKey ? "nip04" : "password"]);
      }
      
      // Add slug tag for better content addressing (NIP-23)
      event.tags.push(["slug", slug]);
      
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
        title: isEncrypted ? processedTitle : title, // Store encrypted title
        language,
        content: processedContent, // Store encrypted content
        tags,
        publishedAt,
        author: nostrService.publicKey || 'local-user',
        event,
        slug,
        encrypted: isEncrypted,
        encryptionMetadata // Store encryption metadata for password-based encryption
      };
      
      console.log("Calling onNoteSaved with note:", newNote);
      
      // Save to the parent component's state
      onNoteSaved(newNote);
      
      // Update the local state
      setNoteId(eventId);
      
      toast.success(`Note saved ${isEncrypted ? "and encrypted" : ""} successfully!`);
      
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
    
    if (isEncrypted) {
      toast.warning("Warning: Sharing an encrypted note link. Only you can decrypt and view this note.");
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
    // Don't reset encryption settings - user may want to keep it on/off
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
    isEncrypted,
    toggleEncryption,
    togglePreview,
    canSave,
    handleSave,
    copyToClipboard,
    shareNote,
    clearEditor,
    isLoggedIn: !!nostrService.publicKey
  };
}

