
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, Save, Share, Clock, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { nostrService } from "@/lib/nostr";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const NotebinPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  // Fetch saved notebins when the page loads
  useEffect(() => {
    const fetchSavedNotes = async () => {
      setIsLoading(true);
      try {
        // Query for kind 30023 events (NIP-23 long-form content)
        const filter = {
          kinds: [30023],
          limit: 20
        };
        
        // Connect to relays if not already connected
        await nostrService.connectToDefaultRelays();
        
        // Use subscribe instead of queryEvents since that's what's available in nostrService
        const subId = nostrService.subscribe([filter], (event) => {
          console.log("Received event:", event);
          
          // Extract title from tags
          const titleTag = event.tags.find(tag => tag[0] === 'title');
          const title = titleTag ? titleTag[1] : 'Untitled Note';
          
          // Extract published date
          const publishedTag = event.tags.find(tag => tag[0] === 'published_at');
          const publishedAt = publishedTag 
            ? new Date(parseInt(publishedTag[1]) * 1000).toLocaleString() 
            : new Date(event.created_at * 1000).toLocaleString();
            
          const note = {
            id: event.id,
            title,
            content: event.content,
            publishedAt,
            author: event.pubkey,
            event
          };
          
          // Add to saved notes if not already there
          setSavedNotes(prev => {
            if (prev.some(n => n.id === note.id)) {
              return prev;
            }
            return [note, ...prev];
          });
        });
        
        // Unsubscribe after a short time to avoid continuous updates
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setIsLoading(false);
        }, 5000);
      } catch (error) {
        console.error("Error fetching saved notes:", error);
        toast({
          title: "Error",
          description: "Failed to fetch saved notes",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    fetchSavedNotes();
  }, [toast]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please provide both title and content",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Use NIP-23 long-form content
      const event = {
        kind: 30023,
        content: content,
        tags: [
          ["title", title],
          ["published_at", Math.floor(Date.now() / 1000).toString()],
          ["d", `notebin-${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
        ]
      };

      const eventId = await nostrService.publishEvent(event);

      if (eventId) {
        toast({
          title: "Success",
          description: "Note saved successfully!"
        });
        
        // Add the new note to the saved notes
        const newNote = {
          id: eventId,
          title,
          content,
          publishedAt: new Date().toLocaleString(),
          author: nostrService.publicKey,
          event
        };
        
        setSavedNotes(prev => [newNote, ...prev]);
        
        // Reset form
        setTitle("");
        setContent("");
      } else {
        throw new Error("Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (noteId: string) => {
    if (!nostrService.publicKey) {
      toast({
        title: "Error",
        description: "You must be logged in to delete notes",
        variant: "destructive"
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // Find the note to be deleted
      const noteToDelete = savedNotes.find(note => note.id === noteId);
      
      if (!noteToDelete) {
        throw new Error("Note not found");
      }
      
      // Check if user is the author of the note
      if (noteToDelete.author !== nostrService.publicKey) {
        toast({
          title: "Error",
          description: "You can only delete your own notes",
          variant: "destructive"
        });
        setIsDeleting(false);
        return;
      }
      
      // Create a deletion event (NIP-09)
      const deletionEvent = {
        kind: 5, // Event deletion
        content: "Deleted notebin",
        tags: [
          ["e", noteId] // Reference to the event being deleted
        ]
      };
      
      const deletionEventId = await nostrService.publishEvent(deletionEvent);
      
      if (deletionEventId) {
        // Remove the note from the local state
        setSavedNotes(prev => prev.filter(note => note.id !== noteId));
        
        toast({
          title: "Success",
          description: "Note deleted successfully!"
        });
      } else {
        throw new Error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setNoteToDelete(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar - conditionally shown */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden ${sidebarVisible ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarVisible(false)}>
        <div className="w-64 h-full bg-background border-r" onClick={e => e.stopPropagation()}>
          <Sidebar />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Notebin</h1>
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto p-4">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Input 
                    placeholder="Note Title" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg font-medium"
                  />
                </div>
                
                <div>
                  <Textarea 
                    placeholder="Write your content here..." 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] resize-y"
                  />
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => {
                    setTitle("");
                    setContent("");
                  }}>
                    Clear
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving || !nostrService.publicKey}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
                
                {!nostrService.publicKey && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    You need to be logged in to save notes.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Display Saved Notebins */}
          <h2 className="text-xl font-semibold mb-4">Your Saved Notes</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading saved notes...</p>
            </div>
          ) : savedNotes.length > 0 ? (
            <div className="space-y-4">
              {savedNotes.map((note) => (
                <ContextMenu key={note.id}>
                  <ContextMenuTrigger>
                    <Card className="hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-medium">{note.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {note.publishedAt}
                        </p>
                        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                          {note.content}
                        </p>
                        
                        {/* Only show delete button for user's own notes */}
                        {nostrService.publicKey && note.author === nostrService.publicKey && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(note.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {nostrService.publicKey && note.author === nostrService.publicKey && (
                      <ContextMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10" 
                        onClick={() => setNoteToDelete(note.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Note
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">No saved notes yet.</p>
              {!nostrService.publicKey && (
                <p className="text-sm text-muted-foreground mt-2">
                  Login to create and save notes.
                </p>
              )}
            </div>
          )}
          
          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Note</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this note? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => noteToDelete && handleDelete(noteToDelete)}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
};

export default NotebinPage;
