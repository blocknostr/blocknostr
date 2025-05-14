
import { useState, useEffect } from "react";
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

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const { preferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<FeedType>(preferences.defaultFeed);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const [scrolledDown, setScrolledDown] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  const isOffline = contentCache.isOffline();

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
    if (value === 'global' || value === 'following' || value === 'for-you') {
      setActiveTab(value as FeedType);
    }
  };

  return (
    <div className={cn("max-w-2xl mx-auto", fontSizeClass)}>
      {/* Fixed header container for both CreateNoteForm and Tabs */}
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur-md pb-1 shadow-sm">
        {/* Offline banner */}
        {isOffline && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
            <span>You're currently offline. Viewing cached content.</span>
          </div>
        )}
        
        {/* Create Note Form */}
        <div className="mb-4 pt-4 px-2 sm:px-0">
          <CreateNoteForm />
        </div>
        
        {/* Tabs navigation */}
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
      
      {/* Connection Status Banner - Below the fixed header */}
      <div className="pt-4">
        {isLoggedIn && <ConnectionStatusBanner />}
      </div>
      
      {/* Feed content that will scroll under the fixed header */}
      <div className="mt-2">
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="relative"
        >
          <TabsContent value="global">
            <GlobalFeed activeHashtag={activeHashtag} />
          </TabsContent>
          
          <TabsContent value="following">
            {!isLoggedIn ? (
              <div className="py-8 text-center text-muted-foreground">
                You need to log in to see posts from people you follow.
              </div>
            ) : (
              <FollowingFeed activeHashtag={activeHashtag} />
            )}
          </TabsContent>
          
          <TabsContent value="for-you">
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
