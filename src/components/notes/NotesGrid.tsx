
import React from "react";
import { Note } from "./hooks/types";
import NoteCard from "./NoteCard";

interface NotesGridProps {
  notes: Note[];
  onNoteClick: (note: Note) => void;
  onDeleteClick: (noteId: string) => void;
  view: "grid" | "list";
}

const NotesGrid = ({ notes, onNoteClick, onDeleteClick, view }: NotesGridProps) => {
  return (
    <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onNoteClick={onNoteClick}
          onDeleteClick={onDeleteClick}
          view={view}
        />
      ))}
    </div>
  );
};

export default NotesGrid;
