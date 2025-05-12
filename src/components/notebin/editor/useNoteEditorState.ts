import { useNoteContent } from "./hooks/useNoteContent";
import { useNoteEncryption } from "./hooks/useNoteEncryption";
import { usePreviewMode } from "./hooks/usePreviewMode";
import { useNoteSaving } from "./hooks/useNoteSaving";
import { useNoteSharing } from "./hooks/useNoteSharing";
import { nostrService } from "@/lib/nostr";
import { Note } from "../hooks/types";

export function useNoteEditorState(onNoteSaved: (note: Note) => void) {
  // Use our custom hooks
  const { 
    title, setTitle,
    content, setContent,
    language, setLanguage,
    tags, setTags, 
    noteId, setNoteId,
    copyToClipboard, 
    clearContent 
  } = useNoteContent();
  
  const { 
    isEncrypted, 
    toggleEncryption,
    getEncryptionDetails 
  } = useNoteEncryption();
  
  const { 
    previewMode, 
    togglePreview 
  } = usePreviewMode();
  
  const { 
    isSaving, 
    canSave, 
    handleSave 
  } = useNoteSaving({
    title,
    content,
    language,
    tags,
    noteId,
    getEncryptionDetails,
    onNoteSaved
  });
  
  const { 
    shareNote 
  } = useNoteSharing({
    noteId,
    isEncrypted
  });
  
  // Clear editor function that preserves encryption settings
  const clearEditor = () => {
    clearContent();
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
