
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Menu, Save, Share, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { nostrService } from "@/lib/nostr";

const NotebinPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
        
        const events = await nostrService.queryEvents(filter);
        const processedNotes = events.map(event => {
          // Extract title from tags
          const titleTag = event.tags.find(tag => tag[0] === 'title');
          const title = titleTag ? titleTag[1] : 'Untitled Note';
          
          // Extract published date
          const publishedTag = event.tags.find(tag => tag[0] === 'published_at');
          const publishedAt = publishedTag 
            ? new Date(parseInt(publishedTag[1]) * 1000).toLocaleString() 
            : new Date(event.created_at * 1000).toLocaleString();
            
          return {
            id: event.id,
            title,
            content: event.content,
            publishedAt,
            author: event.pubkey,
            event
          };
        });
        
        setSavedNotes(processedNotes);
      } catch (error) {
        console.error("Error fetching saved notes:", error);
        toast({
          title: "Error",
          description: "Failed to fetch saved notes",
          variant: "destructive"
        });
      } finally {
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
                <Card key={note.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <h3 className="text-lg font-medium">{note.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {note.publishedAt}
                    </p>
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                      {note.content}
                    </p>
                  </CardContent>
                </Card>
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
        </div>
      </div>
    </div>
  );
};

export default NotebinPage;
