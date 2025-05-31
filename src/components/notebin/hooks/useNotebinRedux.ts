import { useState, useCallback, useEffect } from "react";
import { useNoteFetcher } from "./useNoteFetcher";
import { useNoteOperations } from "./useNoteOperations";
import { Note } from "./types";
import { SortOption } from "../SortOptions";
import { useNotebinState } from "@/hooks/useLocalStorageState";
import { useAppSelector } from "@/hooks/redux";
import { selectUseReduxForNotebin } from "@/store/slices/appSlice";
import { SavedNote } from "@/store/slices/localStorageSlice";

// ✅ NEW: Conversion functions between Note and SavedNote types
const noteToSavedNote = (note: Note): SavedNote => ({
  id: note.id,
  title: note.title || "Untitled",
  content: note.content,
  language: note.language || "text",
  tags: note.tags || [],
  createdAt: note.createdAt || (note.publishedAt ? new Date(note.publishedAt).getTime() : Date.now()),
  updatedAt: note.createdAt || (note.publishedAt ? new Date(note.publishedAt).getTime() : Date.now()),
  isPublic: true,
  authorId: note.author
});

const savedNoteToNote = (savedNote: SavedNote): Note => ({
  id: savedNote.id,
  title: savedNote.title,
  content: savedNote.content,
  language: savedNote.language,
  author: savedNote.authorId || "",
  publishedAt: new Date(savedNote.createdAt).toISOString(),
  createdAt: savedNote.createdAt,
  tags: savedNote.tags,
  encrypted: false,
  event: null, // Redux notes don't have events
  slug: ""
});

export function useNotebinRedux() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [tags, setTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Check if we should use Redux for Notebin state
  const useReduxForNotebin = useAppSelector(selectUseReduxForNotebin);
  
  // Get Redux Notebin state
  const { notes: reduxNotes, view: reduxView, sortOption: reduxSortOption, addNote, updateNote, setView, setSortOption } = useNotebinState();
  
  // For compatibility during migration, maintain local state as fallback
  const [localView, setLocalView] = useState<"grid" | "list">("grid");
  const [localSortOption, setLocalSortOption] = useState<SortOption>("newest");
  const [localSavedNotes, setLocalSavedNotes] = useState<Note[]>([]);
  
  // Use our hooks for different functionalities
  const noteFetcher = useNoteFetcher();
  const { noteToDelete, isDeleting, handleDelete, isLoggedIn, setNoteToDelete, canDeleteNote } = useNoteOperations();
  
  // Determine which state to use based on feature flag
  const savedNotes = useReduxForNotebin ? reduxNotes : localSavedNotes;
  const view = useReduxForNotebin ? reduxView : localView;
  const sortOption = useReduxForNotebin ? reduxSortOption : localSortOption;
  
  // ✅ FIXED: Convert Redux SavedNotes to Note format for consistency
  const convertedSavedNotes: Note[] = useReduxForNotebin 
    ? reduxNotes.map(savedNoteToNote)
    : localSavedNotes;
  
  // ✅ DEBUG: Log state for debugging
  useEffect(() => {
    console.log('[useNotebinRedux] Debug Info:', {
      useReduxForNotebin,
      reduxNotesCount: reduxNotes.length,
      localNotesCount: localSavedNotes.length,
      convertedNotesCount: convertedSavedNotes.length,
      fetcherNotesCount: noteFetcher.notebinNotes.length,
      isLoading: noteFetcher.isLoading
    });
  }, [useReduxForNotebin, reduxNotes.length, localSavedNotes.length, convertedSavedNotes.length, noteFetcher.notebinNotes.length, noteFetcher.isLoading]);
  
  // Load initial data from localStorage if not using Redux
  useEffect(() => {
    if (!useReduxForNotebin) {
      try {
        // Load saved notes
        const savedNotesJson = localStorage.getItem("notebin_saved_notes");
        if (savedNotesJson) {
          setLocalSavedNotes(JSON.parse(savedNotesJson));
        }
        
        // Load view preference
        const savedView = localStorage.getItem("notebin_view");
        if (savedView === "grid" || savedView === "list") {
          setLocalView(savedView as "grid" | "list");
        }
        
        // Load sort option
        const savedSort = localStorage.getItem("notebin_sort");
        if (savedSort) {
          setLocalSortOption(savedSort as SortOption);
        }
      } catch (e) {
        console.error("Error loading from localStorage:", e);
      }
    }
  }, [useReduxForNotebin]);
  
  // Save view preference to appropriate storage
  useEffect(() => {
    if (useReduxForNotebin) {
      // Redux state is handled by redux-persist
    } else {
      // Use localStorage directly
      localStorage.setItem("notebin_view", view);
    }
  }, [view, useReduxForNotebin]);
  
  // Save sort option to appropriate storage
  useEffect(() => {
    if (!useReduxForNotebin) {
      localStorage.setItem("notebin_sort", sortOption);
    }
  }, [sortOption, useReduxForNotebin]);
  
  // Combine local notes with remote notes
  const allNotes = [...convertedSavedNotes, ...noteFetcher.notebinNotes];
  
  // Filter out duplicate notes (same ID)
  const uniqueNotes = allNotes.filter((note, index, self) => 
    index === self.findIndex(n => n.id === note.id)
  );
  
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
    if (useReduxForNotebin) {
      setView(newView);
    } else {
      setLocalView(newView);
    }
  }, [useReduxForNotebin, setView]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    if (useReduxForNotebin) {
      setSortOption(newSort);
    } else {
      setLocalSortOption(newSort);
    }
  }, [useReduxForNotebin, setSortOption]);

  // Handle search change
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle successful note save
  const handleNoteSaved = useCallback((note: Note) => {
    console.log("Saving note:", note);
    
    if (useReduxForNotebin) {
      // ✅ FIXED: Convert Note to SavedNote format for Redux
      const savedNote = noteToSavedNote(note);
      const exists = reduxNotes.some(n => n.id === note.id);
      if (exists) {
        updateNote(note.id, savedNote);
      } else {
        addNote(savedNote);
      }
    } else {
      // Use localStorage directly
      setLocalSavedNotes(prev => {
        // Check if note already exists (by ID) and update it
        const noteExists = prev.some(existingNote => existingNote.id === note.id);
        
        if (noteExists) {
          const updated = prev.map(existingNote => 
            existingNote.id === note.id ? note : existingNote
          );
          localStorage.setItem("notebin_saved_notes", JSON.stringify(updated));
          return updated;
        }
        
        // Otherwise add as a new note
        const newNotes = [note, ...prev];
        localStorage.setItem("notebin_saved_notes", JSON.stringify(newNotes));
        return newNotes;
      });
    }

    // ✅ FIXED: Use a more stable approach to refresh notes
    if (isLoggedIn) {
      setTimeout(() => {
        // Get the fresh refresh function instead of using the hook dependency
        const refreshFn = noteFetcher.refreshNotes;
        if (refreshFn) {
          refreshFn();
        }
      }, 1500);
    }

    // Scroll to notes list more gently 
    setTimeout(() => {
      requestAnimationFrame(() => {
        document.getElementById('notesListSection')?.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }, 100);
  }, [useReduxForNotebin, reduxNotes, updateNote, addNote, isLoggedIn]); // ✅ Remove noteFetcher dependency

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

  // ✅ FIXED: Refresh notes on login status change - remove dependency on noteFetcher object
  useEffect(() => {
    if (isLoggedIn) {
      // Use a timeout to prevent immediate refresh loops
      const timer = setTimeout(() => {
        noteFetcher.refreshNotes();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]); // ✅ Remove noteFetcher from dependencies to prevent infinite loop

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
    refreshNotes: noteFetcher.refreshNotes,
    // For debugging
    isUsingRedux: useReduxForNotebin
  };
} 
