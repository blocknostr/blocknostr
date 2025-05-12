
import Sidebar from "@/components/Sidebar";
import MessagingSystem from "@/components/MessagingSystem";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const MessagesPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [encryptionInfoShown, setEncryptionInfoShown] = useState(true);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar - conditionally shown */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden ${sidebarVisible ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarVisible(false)}>
        <div className="w-72 h-full bg-background border-r shadow-md" onClick={e => e.stopPropagation()}>
          <Sidebar />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block w-72 border-r fixed h-full shadow-md">
        <Sidebar />
      </div>
      
      <div className="flex-1 ml-0 md:ml-72 flex flex-col h-screen">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
          <div className="flex items-center h-14 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-3 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-xl">Messages</h1>
          </div>
        </header>
        
        {encryptionInfoShown && (
          <Alert className="mx-4 my-1 border-primary/20 bg-primary/5">
            <InfoIcon className="h-4 w-4 text-primary" />
            <AlertTitle className="text-sm font-medium">End-to-End Encrypted</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground">
              Messages are encrypted using NIP-04 for maximum security. Only you and your recipient can read them.
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs ml-2 text-primary"
                onClick={() => setEncryptionInfoShown(false)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex-1 overflow-hidden">
          <MessagingSystem />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
