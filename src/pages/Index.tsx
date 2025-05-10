
import MainFeed from "@/components/MainFeed";
import Sidebar from "@/components/Sidebar";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import { useEffect, useState } from "react";
import { nostrService } from "@/lib/nostr";
import LoginButton from "@/components/LoginButton";
import { Lightbulb, Menu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import GlobalSearch from "@/components/GlobalSearch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useSwipeable } from "@/hooks/use-swipeable";
import { useTheme } from "@/hooks/use-theme";

const Index = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const isMobile = useIsMobile();
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  
  useEffect(() => {
    // Init connection to relays when the app loads
    const initNostr = async () => {
      await nostrService.connectToDefaultRelays();
    };
    
    initNostr();
  }, []);

  const handleTopicClick = (topic: string) => {
    setActiveHashtag(topic);
    if (isMobile) {
      setRightPanelOpen(false);
    }
    // Scroll to top of the feed
    window.scrollTo(0, 0);
  };

  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };

  // Setup swipe handlers for mobile gesture navigation
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && !rightPanelOpen) {
        setRightPanelOpen(true);
        setLeftPanelOpen(false);
      }
    },
    onSwipedRight: () => {
      if (isMobile && !leftPanelOpen) {
        setLeftPanelOpen(true);
        setRightPanelOpen(false);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: false
  });

  // Close panels when clicking on main content (mobile only)
  const handleMainContentClick = () => {
    if (isMobile) {
      setLeftPanelOpen(false);
      setRightPanelOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background relative">
      {/* Mobile left panel */}
      {isMobile && (
        <Sheet open={leftPanelOpen} onOpenChange={setLeftPanelOpen}>
          <SheetContent side="left" className="p-0 w-[80%] max-w-[300px]">
            <div className="h-full">
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop sidebar - only visible on non-mobile */}
      {!isMobile && <Sidebar />}
      
      <div 
        className={cn(
          "flex-1 transition-all duration-200",
          !isMobile && "ml-64"
        )}
        {...swipeHandlers}
      >
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2" 
                onClick={() => setLeftPanelOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            )}
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
        
        <div className="flex" onClick={handleMainContentClick}>
          <main className="flex-1 border-r min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <MainFeed 
                activeHashtag={activeHashtag} 
                onClearHashtag={clearHashtag}
              />
            </div>
          </main>
          
          {/* Desktop right sidebar - only visible on non-mobile screens */}
          {!isMobile && (
            <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
              <div className="space-y-6">
                <div className="mb-4">
                  <GlobalSearch />
                </div>
                <TrendingSection onTopicClick={handleTopicClick} />
                <WhoToFollow />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Mobile right panel */}
      {isMobile && (
        <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
          <SheetContent side="right" className="p-4 w-[80%] max-w-[300px] overflow-y-auto">
            <div className="space-y-6">
              <div className="mb-4">
                <GlobalSearch />
              </div>
              <TrendingSection onTopicClick={handleTopicClick} />
              <WhoToFollow />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default Index;
