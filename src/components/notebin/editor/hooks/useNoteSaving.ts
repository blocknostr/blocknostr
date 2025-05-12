
import { useState } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { encryption } from "@/lib/encryption";
import { Note } from "../../hooks/types";

interface UseNoteSavingProps {
  title: string;
  content: string;
  language: string;
  tags: string[];
  noteId: string | null;
  getEncryptionDetails: () => {
    isEncrypted: boolean;
    encryptionMethod: string | null;
    encryptionKey: string | null;
    password: string | null;
  };
  onNoteSaved: (note: Note) => void;
}

export function useNoteSaving({
  title,
  content,
  language,
  tags,
  noteId,
  getEncryptionDetails,
  onNoteSaved
}: UseNoteSavingProps) {
  const [isSaving, setIsSaving] = useState(false);
  
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
      const { isEncrypted, encryptionMethod, password } = getEncryptionDetails();
      let processedContent = content;
      let processedTitle = title;
      let encryptionMetadata = null;
      
      if (isEncrypted) {
        // Encrypt the content and title
        if (nostrService.publicKey) {
          // Use NIP-04 encryption
          processedContent = await encryption.encryptContent(content) || content;
          processedTitle = await encryption.encryptContent(title) || title;
        } else if (password) {
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
        event.tags.push(["encryption", encryptionMethod === "nip04" ? "nip04" : "password"]);
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
      
      toast.success(`Note saved ${isEncrypted ? "and encrypted" : ""} successfully!`);
      
      return eventId;
      
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    canSave,
    handleSave
  };
}
