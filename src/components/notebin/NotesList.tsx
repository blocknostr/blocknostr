import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { nostrService, NostrEvent, EVENT_KINDS } from "@/lib/nostr";
import DeleteDialog from "./DeleteDialog";

interface Note {
  id: string;
  title: string;
  content: string;
  language: string;
  publishedAt: string;
  author: string;
  event: NostrEvent;
}

interface NotesListProps {
  selectedId?: string;
}

const NotesList = ({ selectedId }: NotesListProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [savedNotes, setSavedNotes] = useState<Note[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const navigate = useNavigate();
  const isLoggedIn = !!nostrService.publicKey;

  useEffect(() => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    const fetchNotes = async () => {
      setIsLoading(true);

      try {
        // Subscribe to notebin events from the current user
        const subId = nostrService.subscribe(
          [
            {
              kinds: [EVENT_KINDS.TEXT_NOTE],
              authors: [nostrService.publicKey!],
              "#t": ["notebin"],
              limit: 50,
            },
          ],
          handleNoteEvent
        );

        // Set timeout to stop loading state if no notes are found
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);

        return () => {
          nostrService.unsubscribe(subId);
        };
      } catch (error) {
        console.error("Error fetching notes:", error);
        setIsLoading(false);
      }
    };

    fetchNotes();
  }, [isLoggedIn]);

  const handleNoteEvent = (event: NostrEvent) => {
    try {
      // Extract note data from tags
      const titleTag = event.tags.find((tag) => tag[0] === "title");
      const languageTag = event.tags.find((tag) => tag[0] === "language");

      const note: Note = {
        id: event.id,
        title: titleTag ? titleTag[1] : "Untitled Note",
        content: event.content,
        language: languageTag ? languageTag[1] : "text",
        publishedAt: new Date(event.created_at * 1000).toLocaleString(),
        author: event.pubkey,
        event: event,
      };

      setSavedNotes((prev) => {
        // Check if we already have this note
        const existingIndex = prev.findIndex((n) => n.id === note.id);
        if (existingIndex !== -1) {
          // Update existing note
          const updated = [...prev];
          updated[existingIndex] = note;
          return updated;
        } else {
          // Add new note
          const newNotes = [...prev, note];
          // Sort by most recent first
          newNotes.sort((a, b) => {
            return b.event.created_at - a.event.created_at;
          });
          return newNotes;
        }
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Error processing note event:", error);
    }
  };

  const handleNoteClick = (note: Note) => {
    navigate(`/notebin/${note.id}`);
  };

  const handleDeleteClick = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (noteToDelete) {
      try {
        // Create a deletion event
        const event = {
          kind: EVENT_KINDS.DELETE,
          tags: [["e", noteToDelete]],
          content: "Deleted note",
        };

        const deleteId = await nostrService.publishEvent(event);

        if (deleteId) {
          toast.success("Note deleted successfully");
          // Remove from local state
          setSavedNotes((prev) => prev.filter((note) => note.id !== noteToDelete));

          // Navigate away if viewing the deleted note
          if (selectedId === noteToDelete) {
            navigate("/notebin");
          }
        } else {
          toast.error("Failed to delete note");
        }
      } catch (error) {
        console.error("Error deleting note:", error);
        toast.error("An error occurred while deleting note");
      } finally {
        setDeleteDialogOpen(false);
        setNoteToDelete(null);
      }
    }
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Note content copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy content");
      });
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
          {savedNotes.map((note) => (
            <Card 
              key={note.id} 
              className={`hover:border-primary/50 transition-colors cursor-pointer ${
                note.id === selectedId ? "border-primary" : ""
              }`}
              onClick={() => handleNoteClick(note)}
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
                        handleDeleteClick(note.id);
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
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground border-t pt-2">
                  {note.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-muted-foreground">No saved notes yet.</p>
        </div>
      )}

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
      />
    </div>
  );
};

export default NotesList;
