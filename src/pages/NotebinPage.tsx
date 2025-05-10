
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import NoteEditor from "@/components/notebin/NoteEditor";
import NotesList from "@/components/notebin/NotesList";
import Sidebar from "@/components/Sidebar";
import { nostrService } from "@/lib/nostr";
import { ArrowLeft, Bookmark } from "lucide-react";

interface NoteEditorProps {
  onNoteSaved: (noteId: string) => void;
}

const NotebinPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<string>(id ? "view" : "create");
  
  useEffect(() => {
    // Connect to relays when the component mounts
    const connectRelays = async () => {
      await nostrService.connectToRelays();
    };
    
    connectRelays();
  }, []);
  
  useEffect(() => {
    if (id && activeTab !== "view") {
      setActiveTab("view");
    } else if (!id && activeTab === "view") {
      setActiveTab("create");
    }
  }, [id]);

  const handleBack = () => {
    navigate(-1);
  };
  
  const handleNoteSaved = (noteId: string) => {
    toast.success("Note saved successfully");
    navigate(`/notebin/${noteId}`);
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex justify-between items-center h-14 px-4">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={handleBack} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-semibold flex items-center">
                <Bookmark className="h-5 w-5 mr-2" />
                NoteBin
              </h1>
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-[400px] mb-4">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="view">My Notes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <div className="space-y-4">
                <div className="text-muted-foreground text-sm">
                  Create and share text snippets, markdown documents, and more. Your notes are saved to the Nostr network and can be accessed from any device.
                </div>
                <Separator />
                <NoteEditor onNoteSaved={handleNoteSaved} />
              </div>
            </TabsContent>
            
            <TabsContent value="view">
              <NotesList selectedId={id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default NotebinPage;
