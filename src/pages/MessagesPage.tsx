
import Sidebar from "@/components/Sidebar";
import MessagingSystem from "@/components/MessagingSystem";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const MessagesPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [encryptionInfoShown, setEncryptionInfoShown] = useState(true);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar - conditionally shown */}
      <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden ${sidebarVisible ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarVisible(false)}>
        <div className="w-72 h-full bg-background border-r shadow-lg" onClick={e => e.stopPropagation()}>
          <Sidebar />
        </div>
      </div>
      
      {/* Desktop sidebar */}
      <div className="hidden md:block w-72 border-r fixed h-full shadow-sm">
        <Sidebar />
      </div>
      
      <div className="flex-1 ml-0 md:ml-72 flex flex-col">
        <header className="border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10 shadow-sm">
          <div className="flex items-center h-16 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-3 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold text-lg">Messages</h1>
          </div>
        </header>
        
        <div className="px-4 py-2">
          {encryptionInfoShown && (
            <Alert className="mb-3">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>End-to-End Encrypted</AlertTitle>
              <AlertDescription className="text-sm">
                Messages are encrypted using NIP-04 for maximum security. Only you and your recipient can read them.
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs ml-2"
                  onClick={() => setEncryptionInfoShown(false)}
                >
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <div className="flex-1">
          <MessagingSystem />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
