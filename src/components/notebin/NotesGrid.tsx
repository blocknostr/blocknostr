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
    <div className={`${view === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "divide-y divide-border/50"}`}>
      {notes.map((note) => (
        view === "grid" ? (
          <NoteCard
            key={note.id}
            note={note}
            onNoteClick={onNoteClick}
            onDeleteClick={onDeleteClick}
            view={view}
          />
        ) : (
          <div key={note.id} className="px-4 py-1">
            <NoteCard
              note={note}
              onNoteClick={onNoteClick}
              onDeleteClick={onDeleteClick}
              view={view}
            />
          </div>
        )
      ))}
    </div>
  );
};

export default NotesGrid;

