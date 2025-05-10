
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";

interface NotificationsHeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const NotificationsHeader = ({ darkMode, toggleDarkMode }: NotificationsHeaderProps) => {
  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="flex items-center justify-between h-14 px-4">
        <h1 className="font-semibold">Notifications</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default NotificationsHeader;
