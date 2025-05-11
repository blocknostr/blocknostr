
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, FileText, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  title: string;
  content: string;
  language: string;
  publishedAt: string;
  author: string;
  event: any;
  tags?: string[]; // Add support for tags
}

interface NotesListProps {
  isLoading: boolean;
  savedNotes: Note[];
  onNoteClick: (note: Note) => void;
  onDeleteClick: (noteId: string) => void;
  isLoggedIn: boolean;
}

const NotesList = ({ 
  isLoading, 
  savedNotes, 
  onNoteClick, 
  onDeleteClick, 
  isLoggedIn 
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5" />
        <h2 className="text-xl font-semibold">Your Saved Notes</h2>
      </div>
      
      {!isLoggedIn ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">Login to view your saved notes.</p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading saved notes...</p>
        </div>
      ) : savedNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedNotes.map((note) => {
            const noteTags = getNoteTags(note);
            
            return (
              <Card 
                key={note.id} 
                className="hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onNoteClick(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium truncate">{note.title}</h3>
                    <div className="flex items-center space-x-1">
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
                    <span>{note.publishedAt}</span>
                  </div>
                  
                  {noteTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {noteTags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
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
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No saved notes yet.</p>
        </div>
      )}
    </div>
  );
};

export default NotesList;
