
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import GlobalFeed from "./feed/GlobalFeed";
import ForYouFeed from "./feed/ForYouFeed";
import MediaFeed from "./feed/MediaFeed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FeedCustomizationDialog } from "./feed/FeedCustomizationDialog";
import { contentCache } from "@/lib/nostr/cache/content-cache";
import { FeedType, useUserPreferences } from "@/hooks/useUserPreferences";

interface MainFeedProps {
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const MainFeed = ({ activeHashtag, onClearHashtag }: MainFeedProps) => {
  const { preferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState<FeedType>(preferences.defaultFeed);
  const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  const isOffline = contentCache.isOffline();

  // When preferences change, update the active tab if it's the default feed
  useEffect(() => {
    if (activeTab === preferences.defaultFeed) {
      setActiveTab(preferences.defaultFeed);
    }
  }, [preferences.defaultFeed]);

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
    if (value === 'global' || value === 'following' || value === 'for-you' || value === 'media') {
      setActiveTab(value);
    }
  };

  return (
    <div className={cn("max-w-xl mx-auto", fontSizeClass)}>
      {/* Offline banner */}
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <span>You're currently offline. Viewing cached content.</span>
        </div>
      )}
      
      {/* Create Post Form */}
      <CreateNoteForm />
      
      {/* Feed Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="mt-4"
      >
        <TabsList className={cn(
          "w-full mb-4 bg-background border-b border-border/30 rounded-none p-0 h-auto",
          isMobile ? "grid grid-cols-5" : "flex"
        )}>
          <TabsTrigger 
            value="global" 
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:rounded-none rounded-none h-10"
          >
            Global
          </TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:rounded-none rounded-none h-10" 
            disabled={!isLoggedIn}
          >
            Following
          </TabsTrigger>
          <TabsTrigger 
            value="for-you" 
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:rounded-none rounded-none h-10"
          >
            For You
          </TabsTrigger>
          <TabsTrigger 
            value="media" 
            className="flex-1 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:rounded-none rounded-none h-10"
          >
            <Image className="h-4 w-4 mr-1" />
            Media
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
        
        {/* Active hashtag indicator */}
        {activeHashtag && (
          <div className="mb-4 flex items-center">
            <div className="px-3 py-1.5 bg-accent/50 text-accent-foreground rounded-full flex items-center text-sm">
              <span className="mr-2">#{activeHashtag}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 rounded-full" 
                onClick={() => onClearHashtag && onClearHashtag()}
              >
                <span className="sr-only">Clear</span>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                  <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z" fill="currentColor" />
                </svg>
              </Button>
            </div>
          </div>
        )}
        
        <TabsContent value="global">
          <GlobalFeed activeHashtag={activeHashtag} />
        </TabsContent>
        
        <TabsContent value="following">
          {!isLoggedIn ? (
            <div className="py-8 text-center text-muted-foreground border border-border/20 rounded-lg bg-accent/5">
              <p className="mb-2">You need to log in to see posts from people you follow.</p>
              <Button variant="outline" size="sm" onClick={() => document.getElementById('login-button')?.click()}>
                Connect Wallet
              </Button>
            </div>
          ) : (
            <FollowingFeed activeHashtag={activeHashtag} />
          )}
        </TabsContent>
        
        <TabsContent value="for-you">
          <ForYouFeed activeHashtag={activeHashtag} />
        </TabsContent>
        
        <TabsContent value="media">
          <MediaFeed activeHashtag={activeHashtag} />
        </TabsContent>
      </Tabs>

      {/* Customization Dialog */}
      <FeedCustomizationDialog 
        open={isCustomizationDialogOpen}
        onOpenChange={setIsCustomizationDialogOpen}
      />
    </div>
  );
}

export default MainFeed;
