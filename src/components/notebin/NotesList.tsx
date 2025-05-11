
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, FileText, Trash2, Tag, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { NotesSkeleton } from "./NotesSkeleton";
import { Note } from "./hooks/types";

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

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Note content copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy content");
      });
  };

  // Extract tags from note event
  const getNoteTags = (note: Note): string[] => {
    if (note.tags) return note.tags;
    
    // Try to extract tags from event
    if (note.event && Array.isArray(note.event.tags)) {
      return note.event.tags
        .filter(tag => tag[0] === 't' && tag.length >= 2)
        .map(tag => tag[1]);
    }
    
    return [];
  };

  // Calculate time ago for recent notes
  const getTimeAgo = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "some time ago";
    }
  };

  // Check if note is recent (< 24 hours)
  const isRecentNote = (dateString: string): boolean => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      return now.getTime() - date.getTime() < 24 * 60 * 60 * 1000;
    } catch (e) {
      return false;
    }
  };

  // Get gradient background for cards based on language
  const getCardGradient = (language: string): string => {
    const gradients: Record<string, string> = {
      javascript: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20",
      typescript: "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20",
      python: "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20",
      go: "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950/30 dark:to-cyan-900/20",
      rust: "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20",
      java: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/20",
      html: "bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20",
      css: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20",
      text: "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20",
    };
    
    return gradients[language.toLowerCase()] || gradients.text;
  };

  if (!isLoggedIn) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Your Saved Notes</h2>
        </div>
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground mb-4">Login to view your saved notes.</p>
          <Button variant="outline">Sign In</Button>
        </div>
      </div>
    );
  } 
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Your Saved Notes</h2>
        </div>
        <NotesSkeleton view={view} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Your Saved Notes</h2>
      </div>
      
      {savedNotes.length > 0 ? (
        <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {savedNotes.map((note) => {
            const noteTags = getNoteTags(note);
            const timeAgo = getTimeAgo(note.publishedAt);
            const isRecent = isRecentNote(note.publishedAt);
            const cardGradient = getCardGradient(note.language);
            
            return (
              <Card 
                key={note.id} 
                className={`hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden ${cardGradient}`}
                onClick={() => onNoteClick(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium truncate">{note.title}</h3>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="text-muted-foreground hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyContent(note.content);
                        }}
                        aria-label="Copy note content"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" 
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteClick(note.id);
                        }}
                        aria-label="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center mt-2 text-xs text-muted-foreground">
                    <div className="bg-primary/10 text-primary font-medium px-2 py-1 rounded-md">
                      {note.language || 'text'}
                    </div>
                    <span className="mx-2">•</span>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{timeAgo}</span>
                      {isRecent && (
                        <Badge variant="outline" className="ml-2 py-0 text-xs bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                          New
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {noteTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Tag className="h-3 w-3 text-muted-foreground mr-1" />
                      {noteTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs hover:bg-secondary/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground border-t pt-2">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2 opacity-50" />
          <p className="text-muted-foreground mb-1">No saved notes yet.</p>
          <p className="text-sm text-muted-foreground mb-4">Create your first note using the editor above.</p>
          <Button variant="outline" onClick={() => document.querySelector("textarea")?.focus()}>
            Start Writing
          </Button>
        </div>
      )}
    </div>
  );
};

export default NotesList;
