import { useState, useCallback, useEffect } from "react";
import { useNoteFetcher } from "./useNoteFetcher";
import { useNoteOperations } from "./useNoteOperations";
import { Note } from "./types";
import { SortOption } from "../SortOptions";
import useLocalStorage from "@/hooks/ui/use-local-storage";

export function useNotebin() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [tags, setTags] = useState<string[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use our custom localStorage hook for saved notes
  const [savedNotes, setSavedNotes] = useLocalStorage<Note[]>('notebin_saved_notes', []);
  
  // Use our hooks for different functionalities
  const noteFetcher = useNoteFetcher();
  const { noteToDelete, isDeleting, handleDelete, isLoggedIn, setNoteToDelete, canDeleteNote } = useNoteOperations();
  
  // Combine local notes with remote notes
  const allNotes = [...savedNotes, ...noteFetcher.notebinNotes];
  
  // Filter out duplicate notes (same ID)
  const uniqueNotes = allNotes.filter((note, index, self) => 
    index === self.findIndex(n => n.id === note.id)
  );
  
  // Log the current state of notes for debugging
  useEffect(() => {
    console.log("Current saved notes:", savedNotes);
    console.log("Current fetched notes:", noteFetcher.notebinNotes);
  }, [savedNotes, noteFetcher.notebinNotes]);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("notebin_view");
    if (savedView === "grid" || savedView === "list") {
      setView(savedView);
    }
  }, []);

  // Save view preference to localStorage
  useEffect(() => {
    localStorage.setItem("notebin_view", view);
  }, [view]);

  // Search filtering
  const searchFilteredNotes = searchQuery
    ? uniqueNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : uniqueNotes;

  // Sort notes based on selected option
  const sortedNotes = [...searchFilteredNotes].sort((a, b) => {
    switch (sortOption) {
      case "newest":
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      case "oldest":
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      case "az":
        return a.title.localeCompare(b.title);
      case "za":
        return b.title.localeCompare(a.title);
      case "language":
        return a.language.localeCompare(b.language);
      default:
        return 0;
    }
  });

  // Handle view toggling
  const handleViewToggle = useCallback((newView: "grid" | "list") => {
    setView(newView);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortOption(newSort);
  }, []);

  // Handle search change
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle successful note save
  const handleNoteSaved = useCallback((note: Note) => {
    console.log("Saving note:", note);
    setSavedNotes(prev => {
      // Check if note already exists (by ID) and update it
      const noteExists = prev.some(existingNote => existingNote.id === note.id);
      
      if (noteExists) {
        return prev.map(existingNote => 
          existingNote.id === note.id ? note : existingNote
        );
      }
      
      // Otherwise add as a new note
      return [note, ...prev];
    });

    // Refresh notes from network after saving a new one
    if (isLoggedIn) {
      setTimeout(() => {
        noteFetcher.refreshNotes();
      }, 1500);
    }

    // Scroll to notes list more gently 
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.getElementById('notesListSection')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }, 100);
  }, [setSavedNotes, isLoggedIn, noteFetcher]);

  // View a note (load into editor)
  const viewNote = useCallback((note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setLanguage(note.language || "text");
    setTags(note.tags || []);
    
    // Scroll to editor more gently
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.getElementById('noteEditor')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }, 100);
  }, []);

  // Refresh notes on login status change
  useEffect(() => {
    if (isLoggedIn) {
      noteFetcher.refreshNotes();
    }
  }, [isLoggedIn]);

  return {
    savedNotes: uniqueNotes,
    filteredNotes: sortedNotes,
    isLoading: noteFetcher.isLoading,
    title,
    content,
    language,
    tags,
    noteToDelete,
    isDeleting,
    isLoggedIn,
    view,
    sortOption,
    searchQuery,
    handleViewToggle,
    handleSortChange,
    handleSearch,
    handleDelete,
    handleNoteSaved,
    viewNote,
    setNoteToDelete,
    fetchNote: noteFetcher.fetchNote,
    refreshNotes: noteFetcher.refreshNotes
  };
}

