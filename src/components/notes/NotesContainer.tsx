
import React from "react";
import NoteEditor from "@/components/notes/NoteEditor";
import NotesList from "@/components/notes/NotesList";
import DeleteDialog from "@/components/notes/DeleteDialog";
import { ViewToggle } from "@/components/notes/ViewToggle";
import { SortOptions } from "@/components/notes/SortOptions";
import { SearchBar } from "@/components/notes/SearchBar";
import { useNotes } from "./hooks/useNotes";

const NotesContainer: React.FC = () => {
  const {
    filteredNotes,
    isLoading,
    noteToDelete,
    isDeleting,
    isLoggedIn,
    view,
    sortOption,
    handleViewToggle,
    handleSortChange,
    handleSearch,
    handleDelete,
    handleNoteSaved,
    viewNote,
    setNoteToDelete
  } = useNotes();

  return (
    <div className="p-4 h-[calc(100vh-3.5rem)] overflow-auto">
      <div className="max-w-3xl mx-auto">
        {/* Note Editor Component */}
        <div id="noteEditor">
          <NoteEditor onNoteSaved={handleNoteSaved} />
        </div>
        
        {/* Search, Filter and View Controls */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start my-6">
          <div className="w-full md:w-1/2">
            <SearchBar onSearch={handleSearch} />
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SortOptions currentSort={sortOption} onSortChange={handleSortChange} />
            <ViewToggle currentView={view} onViewChange={handleViewToggle} />
          </div>
        </div>
        
        {/* Notes List Component */}
        <div id="notesListSection">
          <NotesList 
            isLoading={isLoading}
            savedNotes={filteredNotes}
            onNoteClick={viewNote}
            onDeleteClick={(noteId) => setNoteToDelete(noteId)}
            isLoggedIn={isLoggedIn}
            view={view}
          />
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteDialog 
        isOpen={!!noteToDelete}
        isDeleting={isDeleting}
        onClose={() => setNoteToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default NotesContainer;
