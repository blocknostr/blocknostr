
import Sidebar from "@/components/Sidebar";
import MessagingSystem from "@/components/MessagingSystem";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const MessagesPage = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
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
      <div className="hidden md:block w-64 border-r fixed h-full">
        <Sidebar />
      </div>
      
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
            <h1 className="font-semibold">Messages</h1>
          </div>
        </header>
        
        <div className="flex-1">
          <MessagingSystem />
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
