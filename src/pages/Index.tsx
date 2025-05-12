
import React, { useEffect, useState, lazy, Suspense } from "react";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { ConnectionStatusBanner } from "@/components/feed/ConnectionStatusBanner";
import { toast } from "sonner";
import { AlertTriangle, Loader2, HardDrive, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

// Lazy load MainFeed to improve initial page load
const MainFeed = lazy(() => import("@/components/MainFeed"));

const Index: React.FC = () => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);
  const [storageErrorDismissed, setStorageErrorDismissed] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  useEffect(() => {
    // Only init connection to relays when logged in and auto-connect is enabled
    const initNostr = async () => {
      try {
        // Only connect to relays if logged in
        if (isLoggedIn) {
          await nostrService.connectToUserRelays();
        }
      } catch (error) {
        console.error("Error initializing Nostr:", error);
        toast.error("Failed to connect to relays");
      } finally {
        setIsInitializing(false);
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
  }, [isLoggedIn, preferences.relayPreferences?.autoConnect, storageAvailable, storageErrorDismissed]);

  const clearHashtag = () => {
    setActiveHashtag(undefined);
  };
  
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
    <div className="max-w-2xl mx-auto px-4 py-4">
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
      
      {/* Show connection status only if logged in */}
      {isLoggedIn && <ConnectionStatusBanner />}
      
      {/* Welcome message (no login button) */}
      {!isLoggedIn && (
        <div className="p-6 rounded-xl bg-gradient-to-br from-background/80 to-background/60 mb-6 shadow-md border border-border/30 animate-in fade-in slide-in-from-bottom-5 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="p-4 bg-primary/10 rounded-full shadow-inner border border-primary/20 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/20 animate-pulse"></div>
              <Shield className="h-10 w-10 text-primary relative z-10" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-light tracking-tight mb-2">
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Welcome to BlockNoster
                </span>
              </h2>
              <p className="text-muted-foreground">
                Connect your Nostr wallet using the button in the top right corner to access the decentralized social network and interact with the Alephium blockchain.
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
      
      {isLoggedIn && isInitializing ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary/60 mb-3" />
          <p className="text-muted-foreground">Initializing connection...</p>
        </div>
      ) : isLoggedIn ? (
        <Suspense fallback={
          <div className="py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary/60 mb-3" />
            <p className="text-muted-foreground">Loading feed...</p>
          </div>
        }>
          <MainFeed activeHashtag={activeHashtag} onClearHashtag={clearHashtag} />
        </Suspense>
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            Use the Connect Wallet button in the top right to join the BlockNoster ecosystem.
          </p>
        </div>
      )}
    </div>
  );
};

export default Index;
