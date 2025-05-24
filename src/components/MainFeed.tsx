
import { useState, useEffect, useRef } from "react";
import { nostrService } from "@/lib/nostr";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import GlobalFeed from "./feed/GlobalFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FeedCustomizationDialog } from "./feed/FeedCustomizationDialog";
import { contentCache } from "@/lib/nostr/cache/content-cache";
import { FeedType, useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "./feed/ConnectionStatusBanner";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<FeedType>(preferences.defaultFeed);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const [isIOS, setIsIOS] = useState(false);
  
  // Store scroll position to restore later
  const scrollPositionRef = useRef(0);
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  const isOffline = contentCache.isOffline();

  // Detect iOS device
  useEffect(() => {
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);
  }, []);

  // When preferences change, update the active tab if it's the default feed
  useEffect(() => {
    if (activeTab === preferences.defaultFeed) {
      setActiveTab(preferences.defaultFeed);
    }
  }, [preferences.defaultFeed]);

  // Track scroll position to add shadow effect when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const position = window.scrollY;
      setScrolledDown(position > 10);
      
      // Store current scroll position when not loading
      if (!isLoading) {
        scrollPositionRef.current = position;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isLoading]);
  
  // Handle loading state changes
  useEffect(() => {
    // Create a custom event listener for loading state changes
    const handleLoadingChange = (event: CustomEvent) => {
      const isLoading = event.detail.isLoading;
      
      if (isLoading) {
        // Store current scroll position before locking
        scrollPositionRef.current = window.scrollY;
        
        // Apply scroll lock
        document.body.style.overflow = 'hidden';
        document.body.style.height = '100vh';
      } else {
        // Remove scroll lock
        document.body.style.overflow = '';
        document.body.style.height = '';
        
        // Restore scroll position
        setTimeout(() => {
          window.scrollTo(0, scrollPositionRef.current);
        }, 50);
      }
      
      setIsLoading(isLoading);
    };
    
    // Listen for loading state events from feed components
    window.addEventListener('feed-loading-change', handleLoadingChange as EventListener);
    return () => {
      window.removeEventListener('feed-loading-change', handleLoadingChange as EventListener);
      
      // Ensure scroll lock is removed when component unmounts
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, []);

  const handleTopicClick = (topic: string) => {
    if (onClearHashtag) {
      // First clear any existing hashtag
      onClearHashtag();
      
      // Then set the new one - this should be handled by the parent component
      // which will pass it back down as activeHashtag
      if (window.location.pathname === "/") {
        window.dispatchEvent(new CustomEvent('set-hashtag', { detail: topic }));
      }
    }
  };

  // Apply font size from preferences to the feed container
  const fontSizeClass = preferences.uiPreferences.fontSize === 'small' 
    ? 'text-sm' 
    : preferences.uiPreferences.fontSize === 'large' 
      ? 'text-lg' 
      : 'text-base';

  // Handler for tab changes that ensures we only set valid FeedType values
  const handleTabChange = (value: string) => {
    // Ensure the value is a valid FeedType before setting it
    if (value === 'global' || value === 'following' || value === 'media') {
      setActiveTab(value as FeedType);
    }
  };

  return (
    <div 
      className={cn(
        "max-w-2xl mx-auto w-full",
        fontSizeClass,
        isLoading ? "relative pointer-events-none" : "",
        isIOS ? "px-safe" : "px-4"
      )}
      ref={feedContainerRef}
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Loading overlay - only visible when loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20" />
      )}
      
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <span>You're currently offline. Viewing cached content.</span>
        </div>
      )}
      
      {/* Create Note Form - No longer in sticky container */}
      <div className="mb-4 sm:px-0 pt-2 w-full">
        <CreateNoteForm />
      </div>
      
      {/* Tabs navigation - Still sticky */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md w-full">
        <div className={cn(
          "border-b border-border/50 w-full",
          scrolledDown ? "shadow-sm" : ""
        )}>
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="relative w-full"
          >
            <TabsList className={cn(
              "w-full",
              isMobile ? "grid grid-cols-3" : "flex"
            )}>
              <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex-1" 
                disabled={!isLoggedIn}
              >
                Following
              </TabsTrigger>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsCustomizationDialogOpen(true)}
                title="Customize feed"
                className="size-10"
              >
                <Settings size={18} />
              </Button>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Connection Status Banner */}
      <div className="pt-2 w-full">
        {isLoggedIn && <ConnectionStatusBanner />}
      </div>
      
      {/* Feed content */}
      <div className="mt-2 space-y-4 w-full" style={{ overscrollBehavior: 'contain' }}>
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="relative w-full"
        >
          <TabsContent value="global" className="w-full">
            <GlobalFeed activeHashtag={activeHashtag} onLoadingChange={setIsLoading} />
          </TabsContent>
          
          <TabsContent value="following" className="w-full">
            {!isLoggedIn ? (
              <div className="py-8 text-center text-muted-foreground">
                You need to log in to see posts from people you follow.
              </div>
            ) : (
              <FollowingFeed activeHashtag={activeHashtag} onLoadingChange={setIsLoading} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Customization Dialog */}
      <FeedCustomizationDialog 
        open={isCustomizationDialogOpen}
        onOpenChange={setIsCustomizationDialogOpen}
      />
    </div>
  );
};

export default MainFeed;
