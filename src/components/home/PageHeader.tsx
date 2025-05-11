
import React from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginButton from "@/components/LoginButton";
import { useTheme } from "@/hooks/use-theme";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMenu from "./MobileMenu";

interface PageHeaderProps {
  leftPanelOpen: boolean;
  setLeftPanelOpen: (open: boolean) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  leftPanelOpen,
  setLeftPanelOpen,
  rightPanelOpen,
  setRightPanelOpen
}) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const isMobile = useIsMobile();

  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-14 px-4">
        {isMobile && (
          <MobileMenu 
            leftPanelOpen={leftPanelOpen}
            setLeftPanelOpen={setLeftPanelOpen}
            rightPanelOpen={rightPanelOpen}
            setRightPanelOpen={setRightPanelOpen}
          />
        )}
        
        <h1 className="font-semibold">Home</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost"
            size="icon"
            className="rounded-full theme-toggle-button"
            onClick={(e) => toggleDarkMode(e)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
          </Button>
          <LoginButton />
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelOpen(true)}
              aria-label="Open trending and who to follow"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
