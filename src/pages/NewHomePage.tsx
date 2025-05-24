
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import NewGlobalFeed from "@/components/feed/NewGlobalFeed";
import NewFollowingFeed from "@/components/feed/NewFollowingFeed";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import CustomizeGlobalFeedDialog from "@/components/feed/CustomizeGlobalFeedDialog";
import { useIsMobile } from "@/hooks/use-mobile";

const NewHomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { preferences, updateNestedPreference } = useUserPreferences();
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS device
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);
  }, []);

  // Callback for feed loading state changes
  const handleLoadingChange = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setActiveHashtag(undefined);
  };

  // Clear active hashtag filter
  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };

  return (
    <div 
      className={`max-w-2xl mx-auto px-4 py-4 ${isIOS ? 'px-safe' : ''}`} 
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Login message for users not logged in */}
      {!isLoggedIn && (
        <div className="mb-8 p-4 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-medium mb-2">Welcome to BlockNoster</h2>
          <p className="text-muted-foreground mb-4">
            Connect your Nostr wallet using the Connect button in the header to access all features.
          </p>
        </div>
      )}

      {/* Tabs for switching between feeds */}
      <div className="mb-6 w-full">
        <div className="flex items-center justify-between mb-4">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList className="w-full">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsCustomizeOpen(true)}
                  aria-label="Customize feed"
                  className="h-8 w-8 mr-1"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
                <TabsTrigger value="global" className={`${isMobile ? 'flex-1' : 'min-w-[100px]'}`}>Global</TabsTrigger>
                <TabsTrigger value="following" className={`${isMobile ? 'flex-1' : 'min-w-[100px]'}`} disabled={!isLoggedIn}>Following</TabsTrigger>
              </TabsList>
            </div>

            {activeHashtag && (
              <div className="mt-3 flex items-center">
                <div className="text-sm text-muted-foreground">
                  Showing posts with <span className="font-medium">#{activeHashtag}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearHashtag}
                  className="text-xs h-6 ml-2"
                >
                  Clear filter
                </Button>
              </div>
            )}

            {/* Feed content */}
            <TabsContent 
              value="global" 
              className="mt-4 p-0 border-none w-full" 
              style={{ overscrollBehavior: 'contain' }}
            >
              <NewGlobalFeed 
                activeHashtag={activeHashtag} 
                onLoadingChange={handleLoadingChange} 
              />
            </TabsContent>
            
            <TabsContent 
              value="following" 
              className="mt-4 p-0 border-none w-full"
              style={{ overscrollBehavior: 'contain' }}
            >
              {isLoggedIn ? (
                <NewFollowingFeed 
                  activeHashtag={activeHashtag}
                  onLoadingChange={handleLoadingChange}
                />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">
                    Connect your wallet to see posts from people you follow
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Customize Global Feed Dialog */}
      <CustomizeGlobalFeedDialog 
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        defaultHashtags={preferences.feedFilters?.globalFeedTags || []}
        onSave={(hashtags) => {
          updateNestedPreference('feedFilters', 'globalFeedTags', hashtags);
        }}
      />
    </div>
  );
};

export default NewHomePage;
