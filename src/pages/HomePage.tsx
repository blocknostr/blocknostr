import React, { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings2, AlertTriangle, HardDrive, Shield, ExternalLink } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import GlobalFeed from "@/components/feed/GlobalFeed";
import FollowingFeed from "@/components/FollowingFeed";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import CustomizeGlobalFeedDialog from "@/components/feed/CustomizeGlobalFeedDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import CreateNoteForm from "@/components/CreateNoteForm";

/**
 * Consolidated HomePage component that combines features from both
 * NewHomePage and Index components
 */
const HomePage: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<string>("global");
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storageErrorDismissed, setStorageErrorDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  
  // Hooks
  const { preferences, updateNestedPreference, storageAvailable, storageQuotaReached } = useUserPreferences();
  const isLoggedIn = !!nostrService.publicKey;
  const isMobile = useIsMobile();

  useEffect(() => {
    // Detect iOS device
    const detectIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(detectIOS);
    
    // Connect to relays in the background if logged in
    const initNostr = async () => {
      try {
        if (isLoggedIn) {
          await nostrService.connectToUserRelays();
        }
      } catch (error) {
        console.error("Error initializing Nostr:", error);
        toast.error("Failed to connect to relays");
      }
    };
    
    initNostr();
    
    // Listen for hashtag changes from global events
    const handleHashtagChange = (event: CustomEvent) => {
      setActiveHashtag(event.detail);
    };
    
    window.addEventListener('set-hashtag', handleHashtagChange as EventListener);
    
    // Warn user if storage is not available
    if (storageAvailable === false && !storageErrorDismissed) {
      toast.warning(
        "Local storage unavailable", 
        { 
          description: "Your preferences won't be saved between sessions.",
          icon: <AlertTriangle className="h-4 w-4" />
        }
      );
    }
    
    return () => {
      window.removeEventListener('set-hashtag', handleHashtagChange as EventListener);
    };
  }, [isLoggedIn, storageAvailable, storageErrorDismissed]);

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
  
  // Handle clearing storage data when quota reached
  const handleClearStorageData = () => {
    try {
      // Try to clear non-essential data to free up storage
      const keysToKeep = [
        'nostr_pubkey', 
        'nostr_privkey', 
        'nostr_following'
      ];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      
      toast.success("Storage cleared successfully. Refresh the page to continue.");
      setStorageErrorDismissed(true);
    } catch (e) {
      console.error("Error clearing storage:", e);
      toast.error("Failed to clear storage");
    }
  };

  return (
    <div 
      className={`max-w-2xl mx-auto px-4 py-4 ${isIOS ? 'px-safe' : ''}`} 
      style={{ overscrollBehavior: 'contain' }}
    >
      {/* Storage warning if quota reached */}
      {storageQuotaReached && !storageErrorDismissed && (
        <div className="mb-4 p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-sm">
          <div className="flex flex-col space-y-3">
            <div className="flex items-start">
              <HardDrive className="h-5 w-5 flex-shrink-0 mr-2 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Storage limit reached</p>
                <p>
                  Your browser's storage is full. This may affect your experience and prevent saving preferences.
                  Try clearing some storage or using a different browser.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStorageErrorDismissed(true)}
              >
                Dismiss
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleClearStorageData}
              >
                Clear Storage Data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login message for users not logged in */}
      {!isLoggedIn && (
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-background/80 to-background/60 shadow-md border border-border/30 animate-in fade-in slide-in-from-bottom-5 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-full shadow-inner border border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
              <Shield className="h-10 w-10 text-primary relative z-10" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-light tracking-tight mb-2">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Welcome to BlockNostr
                </span>
              </h2>
              <p className="text-muted-foreground">
                Connect your Nostr wallet using the button in the top right corner to access the decentralized social network.
              </p>
              <div className="mt-3">
                <a 
                  href="https://nostr.how"
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center md:justify-start text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" /> 
                  <span>New to Nostr? Learn more</span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Note Form for logged-in users */}
      {isLoggedIn && (
        <div className="mb-6">
          <CreateNoteForm />
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

            {/* Feed content */}            <TabsContent 
              value="global" 
              className="mt-4 p-0 border-none w-full" 
              style={{ overscrollBehavior: 'contain' }}
            >
              <GlobalFeed 
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
                <FollowingFeed 
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

export default HomePage;
