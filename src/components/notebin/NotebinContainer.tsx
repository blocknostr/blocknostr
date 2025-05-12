
'use client';

import React, { useState, useEffect } from "react";
import NoteEditor from "./NoteEditor";
import NotesGrid from "./NotesGrid";
import NotesList from "./NotesList";
import NotesListHeader from "./NotesListHeader";
import { SearchBar } from "./SearchBar";
import { TagFilter } from "./TagFilter";
import { ViewToggle } from "./ViewToggle";
import { useNotebin } from "./hooks/useNotebin";
import NotesEmptyState from "./NotesEmptyState";
import NotesSkeleton from "./NotesSkeleton";
import NotesLoginPrompt from "./NotesLoginPrompt";
import { nostrService } from "@/lib/nostr";

const NotebinContainer: React.FC = () => {
  const {
    filteredNotes: notes,
    isLoading,
    view,
    handleViewToggle,
    sortOption,
    handleSortChange,
    searchQuery,
    handleSearch,
    isLoggedIn,
    handleNoteSaved,
    viewNote,
    setNoteToDelete,
    handleDelete
  } = useNotebin();

  const [isCreateMode, setIsCreateMode] = useState(false);

  const handleCreateNote = () => {
    setIsCreateMode(true);
  };

  const handleCancelCreate = () => {
    setIsCreateMode(false);
  };

  const handleNoteCreated = () => {
    setIsCreateMode(false);
    // Notes will be refetched automatically through useNotebin
  };

  // Render appropriate content based on state
  let content;
  if (isCreateMode) {
    content = (
      <div className="bg-card border border-border rounded-xl shadow-sm p-4 md:p-6">
        <NoteEditor onNoteSaved={handleNoteSaved} />
      </div>
    );
  } else if (isLoading) {
    content = <NotesSkeleton view={view} />;
  } else if (!isLoggedIn) {
    content = <NotesLoginPrompt />;
  } else if (notes.length === 0) {
    content = <NotesEmptyState onCreateNote={handleCreateNote} />;
  } else {
    content = view === "grid" ? (
      <NotesGrid 
        notes={notes} 
        onNoteClick={viewNote} 
        onDeleteClick={(noteId) => setNoteToDelete(noteId)}
        view={view}
      />
    ) : (
      <NotesList 
        isLoading={isLoading}
        savedNotes={notes}
        onNoteClick={viewNote}
        onDeleteClick={(noteId) => setNoteToDelete(noteId)}
        isLoggedIn={isLoggedIn}
        view={view}
      />
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <div className="flex flex-col gap-4">
        {!isCreateMode && (
          <>
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <SearchBar onSearch={handleSearch} />
              
              <div className="flex items-center gap-2 self-end">
                <ViewToggle currentView={view} onViewChange={handleViewToggle} />
                {isLoggedIn && (
                  <button 
                    onClick={handleCreateNote}
                    className="bn-button px-4 py-2 rounded-lg font-medium flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    New Note
                  </button>
                )}
              </div>
            </div>
            
            {notes.length > 0 && (
              <NotesListHeader />
            )}
          </>
        )}

        {content}
      </div>
    </div>
  );
};

export default NotebinContainer;
