
import React from "react";
import { Note } from "./hooks/types";
import { NotesSkeleton } from "./NotesSkeleton";
import NotesGrid from "./NotesGrid";
import NotesEmptyState from "./NotesEmptyState";
import NotesLoginPrompt from "./NotesLoginPrompt";
import NotesListHeader from "./NotesListHeader";

interface NotesListProps {
  isLoading: boolean;
  savedNotes: Note[];
  onNoteClick: (note: Note) => void;
  onDeleteClick: (noteId: string) => void;
  isLoggedIn: boolean;
  view?: "grid" | "list";
}

const NotesList = ({ 
  isLoading, 
  savedNotes, 
  onNoteClick, 
  onDeleteClick, 
  isLoggedIn,
  view = "grid"
}: NotesListProps) => {

  const focusEditor = () => {
    document.querySelector("textarea")?.focus();
  };

  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <NotesListHeader />
        <NotesLoginPrompt />
      </div>
    );
  } 
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <NotesListHeader />
        <NotesSkeleton view={view} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NotesListHeader />
      
      {savedNotes.length > 0 ? (
        <NotesGrid
          notes={savedNotes}
          onNoteClick={onNoteClick}
          onDeleteClick={onDeleteClick}
          view={view}
        />
      ) : (
        <NotesEmptyState onCreateNote={focusEditor} />
      )}
    </div>
  );
};

export default NotesList;
