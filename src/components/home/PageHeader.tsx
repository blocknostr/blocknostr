
import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRightSidebar } from "@/contexts/RightSidebarContext";

interface PageHeaderProps {
  title?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title = "Home" }) => {
  const isMobile = useIsMobile();
  const { rightPanelOpen, setRightPanelOpen } = useRightSidebar();
  
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b h-14 px-4">
      {isMobile && (
        <Button variant="ghost" size="icon">
          <Menu className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      )}
      
      <h1 className="font-semibold text-lg">{title}</h1>
      
      {isMobile && (
        <Button 
          variant={rightPanelOpen ? "secondary" : "ghost"} 
          size="icon"
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
        >
          <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      )}
    </header>
  );
};

export default PageHeader;
