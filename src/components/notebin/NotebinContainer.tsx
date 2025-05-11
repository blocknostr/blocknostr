
import React from "react";
import NoteEditor from "@/components/notebin/NoteEditor";
import NotesList from "@/components/notebin/NotesList";
import { TagFilter } from "@/components/notebin/TagFilter";
import DeleteDialog from "@/components/notebin/DeleteDialog";
import { useNotebin } from "./hooks/useNotebin";

const NotebinContainer: React.FC = () => {
  const {
    filteredNotes,
    isLoading,
    availableTags,
    selectedTags,
    noteToDelete,
    isDeleting,
    isLoggedIn,
    handleTagToggle,
    handleDelete,
    handleNoteSaved,
    viewNote,
    setNoteToDelete
  } = useNotebin();

  return (
    <div className="p-4 h-[calc(100vh-3.5rem)] overflow-auto">
      <div className="max-w-3xl mx-auto">
        {/* Note Editor Component */}
        <NoteEditor onNoteSaved={handleNoteSaved} />
        
        {/* Tag Filter Component */}
        {availableTags.length > 0 && (
          <TagFilter
            availableTags={availableTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            className="mb-6 mt-4 p-4 border rounded-md bg-card"
          />
        )}
        
        {/* Notes List Component */}
        <NotesList 
          isLoading={isLoading}
          savedNotes={filteredNotes}
          onNoteClick={viewNote}
          onDeleteClick={(noteId) => setNoteToDelete(noteId)}
          isLoggedIn={isLoggedIn}
        />
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
