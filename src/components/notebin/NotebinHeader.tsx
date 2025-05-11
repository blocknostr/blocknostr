
import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import BackButton from "@/components/navigation/BackButton";

interface NotebinHeaderProps {
  toggleSidebar: () => void;
}

const NotebinHeader: React.FC<NotebinHeaderProps> = ({ toggleSidebar }) => {
  return (
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
        <BackButton className="mr-2" />
        <h1 className="font-semibold">Notebin</h1>
      </div>
    </header>
  );
};

export default NotebinHeader;
