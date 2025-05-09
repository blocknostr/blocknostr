
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, Save, Share, Copy, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import CodeEditor from "@uiw/react-textarea-code-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// List of language options
const LANGUAGE_OPTIONS = [
  { label: "Plain Text", value: "text" },
  { label: "JavaScript", value: "js" },
  { label: "TypeScript", value: "ts" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "JSON", value: "json" },
  { label: "Markdown", value: "markdown" },
  { label: "Python", value: "python" },
  { label: "Java", value: "java" },
  { label: "C/C++", value: "cpp" },
  { label: "Ruby", value: "ruby" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "PHP", value: "php" },
  { label: "SQL", value: "sql" },
];

const NotebinPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [language, setLanguage] = useState("text");
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  // Fetch saved notebins when the page loads
  useEffect(() => {
    const fetchSavedNotes = async () => {
      if (!nostrService.publicKey) {
        // If user is not logged in, don't fetch notes
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Connect to relays if not already connected
        await nostrService.connectToDefaultRelays();
        
        // Query for kind 30023 events (NIP-23 long-form content)
        // Only fetch notes created by the current user
        const filter = {
          kinds: [30023],
          authors: [nostrService.publicKey],
          limit: 20
        };
        
        // Use subscribe to fetch events
        const subId = nostrService.subscribe([filter], (event) => {
          console.log("Received event:", event);
          
          // Extract title from tags
          const titleTag = event.tags.find(tag => tag[0] === 'title');
          const title = titleTag ? titleTag[1] : 'Untitled Note';
          
          // Extract language from tags
          const langTag = event.tags.find(tag => tag[0] === 'language');
          const language = langTag ? langTag[1] : 'text';
          
          // Extract published date
          const publishedTag = event.tags.find(tag => tag[0] === 'published_at');
          const publishedAt = publishedTag 
            ? new Date(parseInt(publishedTag[1]) * 1000).toLocaleString() 
            : new Date(event.created_at * 1000).toLocaleString();
            
          const note = {
            id: event.id,
            title,
            language,
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

          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        });
        
        // Unsubscribe after a short time to avoid continuous updates
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setIsLoading(false);
        }, 5000);
      } catch (error) {
        console.error("Error fetching saved notes:", error);
        toast.error("Failed to fetch saved notes");
        setIsLoading(false);
      }
    };

    const fetchProfileData = (pubkey: string) => {
      const metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            setProfiles(prev => ({
              ...prev,
              [pubkey]: metadata
            }));
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(metadataSubId);
      }, 5000);
    };

    fetchSavedNotes();
  }, []);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please provide both title and content");
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
          ["language", language],
          ["published_at", Math.floor(Date.now() / 1000).toString()],
          ["d", `notebin-${Math.random().toString(36).substring(2, 10)}`] // Unique identifier
        ]
      };

      const eventId = await nostrService.publishEvent(event);

      if (eventId) {
        toast.success("Note saved successfully!");
        
        // Add the new note to the saved notes
        const newNote = {
          id: eventId,
          title,
          language,
          content,
          publishedAt: new Date().toLocaleString(),
          author: nostrService.publicKey,
          event
        };
        
        setSavedNotes(prev => [newNote, ...prev]);
      } else {
        throw new Error("Failed to save note");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (noteId: string) => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to delete notes");
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
        toast.error("You can only delete your own notes");
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
        
        toast.success("Note deleted successfully!");
      } else {
        throw new Error("Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note. Please try again.");
    } finally {
      setIsDeleting(false);
      setNoteToDelete(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        toast.success("Content copied to clipboard!");
      })
      .catch(() => {
        toast.error("Failed to copy to clipboard");
      });
  };

  const viewNote = (note: any) => {
    setTitle(note.title);
    setContent(note.content);
    setLanguage(note.language || "text");
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
        
        <div className="p-4 h-[calc(100vh-3.5rem)] overflow-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input 
                      placeholder="Note Title" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-medium"
                    />
                  </div>
                  
                  <div className="w-full md:w-48">
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="min-h-[300px] border rounded-md">
                  <CodeEditor
                    value={content}
                    language={language}
                    placeholder="Enter your code or text here..."
                    onChange={(evn) => setContent(evn.target.value)}
                    padding={15}
                    style={{
                      backgroundColor: "var(--background)",
                      fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                      fontSize: 14,
                      minHeight: "300px",
                      width: "100%"
                    }}
                    className="min-h-[300px]"
                  />
                </div>
                
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setTitle("");
                      setContent("");
                      setLanguage("text");
                    }}>
                      Clear
                    </Button>
                    
                    <Button variant="outline" onClick={copyToClipboard}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      disabled={!title || !content}
                    >
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    
                    <Button 
                      onClick={handleSave}
                      disabled={isSaving || !nostrService.publicKey || !title || !content}
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
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Your Saved Notes</h2>
            </div>
            
            {!nostrService.publicKey ? (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-muted-foreground">Login to view your saved notes.</p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading saved notes...</p>
              </div>
            ) : savedNotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedNotes.map((note) => (
                  <Card 
                    key={note.id} 
                    className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => viewNote(note)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium truncate">{note.title}</h3>
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteToDelete(note.id);
                          }}
                        >
                          <Copy className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
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
          </div>
        </div>
        
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
  );
};

export default NotebinPage;
