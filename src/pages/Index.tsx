
import React, { useState, useEffect } from "react";
import MainFeed from "@/components/MainFeed";
import { nostrService } from "@/lib/nostr";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";
import { AlertTriangle, HardDrive, ShieldCheck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
  const { preferences, storageAvailable, storageQuotaReached } = useUserPreferences();
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(undefined);
  const [storageErrorDismissed, setStorageErrorDismissed] = useState(false);
  const isLoggedIn = !!nostrService.publicKey;
  
  useEffect(() => {
    // Connect to relays in the background if logged in
    const initNostr = async () => {
      try {
        // Only connect to relays if logged in
        if (isLoggedIn) {
          // Connect in the background without showing loading state
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
    <div className="max-w-xl mx-auto px-4 py-4">
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
      
      {/* Welcome message (no login button) */}
      {!isLoggedIn && (
        <div className="p-5 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 mb-6 shadow border border-primary/10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
            <div className="p-3 bg-primary/10 rounded-full shadow-inner border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-semibold mb-2">
                Welcome to BlockNoster
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
      
      {/* Directly render MainFeed for logged-in users */}
      {isLoggedIn ? (
        <MainFeed activeHashtag={activeHashtag} onClearHashtag={clearHashtag} />
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
