
import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings2, RefreshCw } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import NewGlobalFeed from "@/components/feed/NewGlobalFeed";
import NewFollowingFeed from "@/components/feed/NewFollowingFeed";
import NewCreateNote from "@/components/note/NewCreateNote";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import CustomizeGlobalFeedDialog from "@/components/feed/CustomizeGlobalFeedDialog";

const NewHomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { preferences, updatePreferences } = useUserPreferences();
  const isLoggedIn = !!nostrService.publicKey;

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
    <div className="max-w-2xl mx-auto px-4 py-4">
      {/* Login message for users not logged in */}
      {!isLoggedIn && (
        <div className="mb-6 p-4 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-medium mb-2">Welcome to BlockNoster</h2>
          <p className="text-muted-foreground mb-4">
            Connect your Nostr wallet using the Connect button in the header to access all features.
          </p>
        </div>
      )}

      {/* Create Note component (only shown when logged in) */}
      {isLoggedIn && <NewCreateNote className="mb-6" />}

      {/* Tabs for switching between feeds */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <div className="flex items-center justify-between">
              <TabsList>
                <TabsTrigger value="global" className="min-w-[100px]">Global</TabsTrigger>
                <TabsTrigger value="following" className="min-w-[100px]" disabled={!isLoggedIn}>Following</TabsTrigger>
              </TabsList>

              <div className="flex items-center space-x-2">
                {activeTab === "global" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsCustomizeOpen(true)}
                    aria-label="Customize feed"
                    className="h-8 px-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">Customize</span>
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    const event = new CustomEvent('refetch-global-feed');
                    window.dispatchEvent(event);
                  }}
                  disabled={isLoading}
                  className="h-8 w-8"
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {activeHashtag && (
              <div className="mt-2 flex items-center">
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
            <TabsContent value="global" className="mt-2 p-0 border-none">
              <NewGlobalFeed 
                activeHashtag={activeHashtag} 
                onLoadingChange={handleLoadingChange} 
              />
            </TabsContent>
            
            <TabsContent value="following" className="mt-2 p-0 border-none">
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
          updatePreferences({
            ...preferences,
            feedFilters: {
              ...preferences.feedFilters,
              globalFeedTags: hashtags
            }
          });
        }}
      />
    </div>
  );
};

export default NewHomePage;
