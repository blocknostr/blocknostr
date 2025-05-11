
import { useMemo } from 'react';
import { Note } from '../components/notebin/hooks/types';

export function useNotebinFilter(notes: Note[], selectedTags: string[]) {
  // Get all unique tags from the notes
  const availableTags = useMemo(() => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      const noteTags = note.tags || [];
      noteTags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags);
  }, [notes]);

  // Filter notes based on selected tags
  const filteredNotes = useMemo(() => {
    if (selectedTags.length === 0) return notes;
    
    return notes.filter(note => {
      const noteTags = note.tags || [];
      return selectedTags.every(tag => noteTags.includes(tag));
    });
  }, [notes, selectedTags]);

  return {
    availableTags,
    filteredNotes
  };
}
