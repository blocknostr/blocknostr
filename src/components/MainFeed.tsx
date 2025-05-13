
import { useState, useEffect, lazy, Suspense } from "react";
import { nostrService } from "@/lib/nostr";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Image } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { contentCache } from "@/lib/nostr/cache/content-cache";
import { FeedType, useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "./feed/ConnectionStatusBanner";
import TabsNavSkeleton from "./feed/TabsNavSkeleton";
import CreateNoteFormSkeleton from "./feed/CreateNoteFormSkeleton";
import FeedLoadingSkeleton from "./feed/FeedLoadingSkeleton";

// Lazy load components
const CreateNoteForm = lazy(() => import("./CreateNoteForm"));
const FollowingFeed = lazy(() => import("./FollowingFeed"));
const GlobalFeed = lazy(() => import("./feed/GlobalFeed"));
const ForYouFeed = lazy(() => import("./feed/ForYouFeed"));
const MediaFeed = lazy(() => import("./feed/MediaFeed"));
const FeedCustomizationDialog = lazy(() => import("./feed/FeedCustomizationDialog"));

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
    <div className={cn("max-w-2xl mx-auto", fontSizeClass)}>
      {isOffline && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 mb-4 rounded-md flex items-center justify-between">
          <span>You're currently offline. Viewing cached content.</span>
        </div>
      )}
      
      {/* CreateNoteForm with Suspense fallback */}
      <Suspense fallback={<CreateNoteFormSkeleton />}>
        <CreateNoteForm />
      </Suspense>
      
      {/* Tabs with Suspense fallback */}
      <Suspense fallback={<TabsNavSkeleton />}>
        <Tabs 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="mt-4"
        >
          <TabsList className={cn(
            "w-full mb-4",
            isMobile ? "grid grid-cols-5" : "flex"
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
            <TabsTrigger value="media" className="flex-1">
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
          
          {/* Connection Status Banner moved below tabs */}
          <ConnectionStatusBanner />
          
          <TabsContent value="global">
            <Suspense fallback={<FeedLoadingSkeleton />}>
              <GlobalFeed activeHashtag={activeHashtag} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="following">
            {!isLoggedIn ? (
              <div className="py-8 text-center text-muted-foreground">
                You need to log in to see posts from people you follow.
              </div>
            ) : (
              <Suspense fallback={<FeedLoadingSkeleton />}>
                <FollowingFeed activeHashtag={activeHashtag} />
              </Suspense>
            )}
          </TabsContent>
          
          <TabsContent value="for-you">
            <Suspense fallback={<FeedLoadingSkeleton />}>
              <ForYouFeed activeHashtag={activeHashtag} />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="media">
            <Suspense fallback={<FeedLoadingSkeleton />}>
              <MediaFeed activeHashtag={activeHashtag} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </Suspense>

      {/* Customization Dialog */}
      <Suspense fallback={null}>
        <FeedCustomizationDialog 
          open={isCustomizationDialogOpen}
          onOpenChange={setIsCustomizationDialogOpen}
        />
      </Suspense>
    </div>
  );
}

export default MainFeed;
