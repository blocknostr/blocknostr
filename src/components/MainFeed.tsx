
import { useState, useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import CreateNoteForm from "./CreateNoteForm";
import FollowingFeed from "./FollowingFeed";
import GlobalFeed from "./feed/GlobalFeed";
import ForYouFeed from "./feed/ForYouFeed";
import MediaFeed from "./feed/MediaFeed";
import TrendingTopics from "./feed/TrendingTopics";
import SavedHashtags from "./feed/SavedHashtags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, X, Image } from "lucide-react";
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
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 mb-2 rounded-md flex items-center justify-between text-xs">
          <span>You're currently offline. Viewing cached content.</span>
        </div>
      )}
      
      <div className="border-b pb-2 mb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Home</h1>
          <div className="flex items-center gap-2">
            {activeHashtag && (
              <div className="flex items-center">
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md flex items-center gap-1 text-xs">
                  #{activeHashtag}
                  <button 
                    onClick={onClearHashtag} 
                    className="rounded-full hover:bg-primary/20 p-0.5 transition-colors"
                    title="Clear filter"
                  >
                    <X size={12} />
                  </button>
                </span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsCustomizationDialogOpen(true)}
              title="Customize feed"
              className="h-7 w-7"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* User's saved hashtags for quick access */}
      {preferences.uiPreferences.showTrending && (
        <div className="mb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <SavedHashtags onTopicClick={handleTopicClick} />
        </div>
      )}
      
      {/* Trending topics at the top */}
      {preferences.uiPreferences.showTrending && (
        <div className="mb-3">
          <TrendingTopics onTopicClick={handleTopicClick} />
        </div>
      )}
      
      <CreateNoteForm />
      
      <Tabs 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="mt-2"
      >
        <TabsList className={cn(
          "w-full mb-2 p-0 h-9 bg-transparent",
          isMobile ? "grid grid-cols-4" : ""
        )}>
          <TabsTrigger value="global" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Global</TabsTrigger>
          <TabsTrigger 
            value="following" 
            className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none" 
            disabled={!isLoggedIn}
          >
            Following
          </TabsTrigger>
          <TabsTrigger value="for-you" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            For You
          </TabsTrigger>
          <TabsTrigger value="media" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
            <Image className="h-3 w-3 mr-1" />
            Media
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="global">
          <GlobalFeed activeHashtag={activeHashtag} />
        </TabsContent>
        
        <TabsContent value="following">
          {!isLoggedIn ? (
            <div className="py-4 text-center text-muted-foreground text-sm">
              You need to log in to see posts from people you follow.
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
};

export default MainFeed;
