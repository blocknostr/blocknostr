
import BackButton from "@/components/navigation/BackButton";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

const NotificationsHeader = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  
  return (
    <div className="flex items-center justify-between py-4 px-4">
      <div className="flex items-center gap-3">
        <BackButton fallbackPath="/" />
        <h1 className="text-xl font-semibold">Notifications</h1>
      </div>
      
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
  );
};

export default NotificationsHeader;
