
import { useState } from "react";
import { toast } from "sonner";
import { useHotkeys } from "../../useHotkeys";

export function useNoteContent() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [tags, setTags] = useState<string[]>([]);
  const [noteId, setNoteId] = useState<string | null>(null);
  
  // Copy functionality
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Content copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };
  
  // Register keyboard shortcuts for content operations
  useHotkeys('ctrl+s', (e) => {
    // This will be linked to save in the main hook
    e.preventDefault();
  }, []);
  
  // Clear content functionality
  const clearContent = () => {
    setTitle("");
    setContent("");
    setLanguage("text");
    setNoteId(null);
    setTags([]);
  };
  
  return {
    title, 
    setTitle,
    content,
    setContent,
    language,
    setLanguage,
    tags,
    setTags,
    noteId,
    setNoteId,
    copyToClipboard,
    clearContent
  };
}
