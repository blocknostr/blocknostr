
import { useState, useCallback } from "react";
import { useNoteFetcher } from "./useNoteFetcher";
import { useNoteOperations } from "./useNoteOperations";
import { useNotebinFilter } from "@/hooks/useNotebinFilter";
import { Note } from "./types";

export function useNotebin() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  
  // Use our hooks for different functionalities
  const noteFetcher = useNoteFetcher();
  const { noteToDelete, isDeleting, handleDelete, isLoggedIn, setNoteToDelete, canDeleteNote } = useNoteOperations();
  
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

  // Handle successful note save
  const handleNoteSaved = (note: Note) => {
    setSavedNotes(prev => [note, ...prev]);
  };

  const viewNote = (note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setLanguage(note.language || "text");
    setTags(note.tags || []);
  };

  return {
    savedNotes,
    filteredNotes,
    isLoading: noteFetcher.isLoading,
    title,
    content,
    language,
    tags,
    availableTags,
    selectedTags,
    noteToDelete,
    isDeleting,
    isLoggedIn,
    handleTagToggle,
    handleDelete,
    handleNoteSaved,
    viewNote,
    setNoteToDelete,
    fetchNote: noteFetcher.fetchNote
  };
}
