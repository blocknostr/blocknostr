
import MainFeed from "@/components/MainFeed";
import Sidebar from "@/components/Sidebar";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import { useEffect, useState } from "react";
import { nostrService } from "@/lib/nostr";
import LoginButton from "@/components/LoginButton";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";

const Index = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Set initial dark mode state based on html class
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);
  
  useEffect(() => {
    // Init connection to relays when the app loads
    const initNostr = async () => {
      await nostrService.connectToDefaultRelays();
    };
    
    initNostr();
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    // Scroll to top of the feed
    window.scrollTo(0, 0);
  };

  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Home</h1>
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
              <LoginButton />
            </div>
          </div>
        </header>
        
        <div className="flex">
          <main className="flex-1 border-r min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <MainFeed 
                activeHashtag={activeHashtag} 
                onClearHashtag={clearHashtag}
              />
            </div>
          </main>
          
          <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="space-y-6">
              <div className="mb-4">
                <GlobalSearch />
              </div>
              <TrendingSection onTopicClick={handleTopicClick} />
              <WhoToFollow />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
