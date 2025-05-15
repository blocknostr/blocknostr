
import React from "react";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import Sidebar from "@/components/sidebar/Sidebar";

interface MobileMenuProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen
}) => {
  return (
    <>
      {/* Mobile left panel */}
      <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
        <SheetContent side="left" className="p-0 w-[80%] max-w-[300px]">
          <div className="h-full">
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile menu buttons */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLeftPanelOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto mr-2"
        onClick={() => setRightPanelOpen(true)}
        aria-label="Open trending and who to follow"
      >
        <ArrowRight className="h-5 w-5" />
      </Button>
    </>
  );
};

export default MobileMenu;
