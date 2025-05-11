import { useState, useCallback, useEffect } from "react";
import { useNoteFetcher } from "./useNoteFetcher";
import { useNoteOperations } from "./useNoteOperations";
import { useNotebinFilter } from "@/hooks/useNotebinFilter";
import { Note } from "./types";
import { SortOption } from "../SortOptions";

export function useNotebin() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Use our hooks for different functionalities
  const noteFetcher = useNoteFetcher();
  const { noteToDelete, isDeleting, handleDelete, isLoggedIn, setNoteToDelete, canDeleteNote } = useNoteOperations();
  
  // Use our custom hook for filtering
  const { availableTags, filteredNotes: tagFilteredNotes } = useNotebinFilter(savedNotes, selectedTags);

  // Load saved notes from localStorage on mount
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem('notebin_saved_notes');
      if (storedNotes) {
        setSavedNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error("Failed to load notes from localStorage:", error);
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('notebin_saved_notes', JSON.stringify(savedNotes));
    } catch (error) {
      console.error("Failed to save notes to localStorage:", error);
    }
  }, [savedNotes]);

  // Search filtering
  const searchFilteredNotes = searchQuery
    ? tagFilteredNotes.filter(note => 
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    : tagFilteredNotes;

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

  // Handle tag toggling for filtering
  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  }, []);

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

    // Show the note list view after saving
    document.getElementById('notesListSection')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // View a note (load into editor)
  const viewNote = useCallback((note: Note) => {
    setTitle(note.title);
    setContent(note.content);
    setLanguage(note.language || "text");
    setTags(note.tags || []);
    
    // Scroll to editor when viewing a note
    document.getElementById('noteEditor')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return {
    savedNotes,
    filteredNotes: sortedNotes,
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
    view,
    sortOption,
    searchQuery,
    handleTagToggle,
    handleViewToggle,
    handleSortChange,
    handleSearch,
    handleDelete,
    handleNoteSaved,
    viewNote,
    setNoteToDelete,
    fetchNote: noteFetcher.fetchNote
  };
}
