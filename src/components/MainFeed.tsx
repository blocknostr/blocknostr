
import { useState, useEffect, useCallback } from "react";
import { nostrService } from "@/lib/nostr";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import GlobalFeed from "./feed/GlobalFeed";
import ForYouFeed from "./feed/ForYouFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FeedCustomizationDialog } from "./feed/FeedCustomizationDialog";
import { contentCache } from "@/lib/nostr/cache/content-cache";
import { FeedType, useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "./feed/ConnectionStatusBanner";
import { cacheManager } from "@/lib/utils/cacheManager";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<FeedType>(preferences.defaultFeed);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const [backgroundLoaded, setBackgroundLoaded] = useState<Record<string, boolean>>({
    global: false,
    following: false,
    'for-you': false,
  });
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  const isOffline = contentCache.isOffline();
  
  // Optimize initial relays connection
  useEffect(() => {
    // Connect to relays once on initial load
    const connectRelays = async () => {
      try {
        await nostrService.connectToUserRelays();
        cacheManager.set('relays_connected_at', Date.now().toString());
      } catch (err) {
        console.error("Failed to connect to relays:", err);
      }
    };
    
    const lastConnected = Number(cacheManager.get('relays_connected_at') || '0');
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    
    if (lastConnected < fiveMinutesAgo) {
      connectRelays();
    }
  }, []);

  // Track and save active tab for persistent navigation
  useEffect(() => {
    if (activeTab) {
      sessionStorage.setItem('last_active_tab', activeTab);
    }
  }, [activeTab]);

  // Restore last active tab from session storage
  useEffect(() => {
    const lastTab = sessionStorage.getItem('last_active_tab') as FeedType | null;
    if (lastTab && ['global', 'following', 'for-you'].includes(lastTab)) {
      // Don't switch to following tab if not logged in
      if (lastTab === 'following' && !isLoggedIn) {
        setActiveTab('global');
      } else {
        setActiveTab(lastTab as FeedType);
      }
    }
  }, [isLoggedIn]);

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
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Update background loading status when tabs change
  useEffect(() => {
    if (activeTab) {
      setBackgroundLoaded(prev => ({
        ...prev,
        [activeTab]: true
      }));
    }
  }, [activeTab]);

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

  // Optimize tab switching
  const handleTabChange = useCallback((value: string) => {
    // Ensure the value is a valid FeedType before setting it
    if (value === 'global' || value === 'following' || value === 'for-you') {
      // Save current scroll position for the tab we're leaving
      if (activeTab) {
        const scrollY = window.scrollY;
        sessionStorage.setItem(`${activeTab}_scroll_position`, scrollY.toString());
      }
      
      // Update active tab
      setActiveTab(value as FeedType);
      
      // Restore scroll position for the new tab
      setTimeout(() => {
        const savedPosition = sessionStorage.getItem(`${value}_scroll_position`);
        if (savedPosition) {
          window.scrollTo({ top: parseInt(savedPosition, 10) });
        }
      }, 100);
    }
  }, [activeTab]);

  // Apply font size from preferences to the feed container
  const fontSizeClass = preferences.uiPreferences.fontSize === 'small' 
    ? 'text-sm' 
    : preferences.uiPreferences.fontSize === 'large' 
      ? 'text-lg' 
      : 'text-base';

  return (
    <div className={cn("max-w-2xl mx-auto", fontSizeClass)}>
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <span>You're currently offline. Viewing cached content.</span>
        </div>
      )}
      
      {/* Create Note Form - No longer in sticky container */}
      <div className="mb-4 px-2 sm:px-0 pt-2">
        <CreateNoteForm />
      </div>
      
      {/* Tabs navigation - Still sticky */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md">
        <div className={cn(
          "border-b border-border/50",
          scrolledDown ? "shadow-sm" : ""
        )}>
          <Tabs 
            value={activeTab} 
            onValueChange={handleTabChange}
            className="relative"
          >
            <TabsList className={cn(
              "w-full",
              isMobile ? "grid grid-cols-4" : "flex"
            )}>
              <TabsTrigger value="global" className="flex-1">Global</TabsTrigger>
              <TabsTrigger 
                value="following" 
                className="flex-1" 
                disabled={!isLoggedIn}
              >
                Following
              </TabsTrigger>
              <TabsTrigger value="for-you" className="flex-1">
                For You
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
      <div className="pt-2">
        {isLoggedIn && <ConnectionStatusBanner />}
      </div>
      
      {/* Feed content */}
      <div className="mt-2 space-y-4">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="relative"
        >
          {/* Global feed - render it even when not active to load in background */}
          <TabsContent value="global" className="m-0">
            <GlobalFeed activeHashtag={activeHashtag} />
          </TabsContent>
          
          {/* Following feed - only show if logged in */}
          <TabsContent value="following" className="m-0">
            {!isLoggedIn ? (
              <div className="py-8 text-center text-muted-foreground">
                You need to log in to see posts from people you follow.
              </div>
            ) : (
              <FollowingFeed activeHashtag={activeHashtag} />
            )}
          </TabsContent>
          
          {/* For You feed */}
          <TabsContent value="for-you" className="m-0">
            <ForYouFeed activeHashtag={activeHashtag} />
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
