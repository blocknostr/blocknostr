
import React from "react";
import NoteEditor from "@/components/notebin/NoteEditor";
import NotesList from "@/components/notebin/NotesList";
import DeleteDialog from "@/components/notebin/DeleteDialog";
import { ViewToggle } from "@/components/notebin/ViewToggle";
import { SortOptions } from "@/components/notebin/SortOptions";
import { SearchBar } from "@/components/notebin/SearchBar";
import { useNotebin } from "./hooks/useNotebin";

const NotebinContainer: React.FC = () => {
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
  } = useNotebin();

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

export default NotebinContainer;

