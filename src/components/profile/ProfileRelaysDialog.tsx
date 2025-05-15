
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useProfileRelays } from "@/hooks/profile/useProfileRelays";
import { useEnhancedRelayConnection } from "@/hooks/profile/useEnhancedRelayConnection";

interface ProfileRelaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  npub: string;
  isOwnProfile: boolean;
}

const ProfileRelaysDialog = ({
  open,
  onOpenChange,
  npub,
  isOwnProfile
}: ProfileRelaysDialogProps) => {
  const [newRelay, setNewRelay] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  // Use custom hooks for relay management
  const { relays: userRelays, loading: loadingProfileRelays } = useProfileRelays(npub);
  const { 
    addRelay: addUserRelay, 
    removeRelay: removeUserRelay,
    adding,
    removing
  } = useEnhancedRelayConnection();
  
  // Reset the new relay input when dialog opens/closes
  useEffect(() => {
    if (open) {
      setNewRelay("");
    }
  }, [open]);
  
  const handleAddRelay = async () => {
    if (!newRelay) return;
    
    // Normalize URL format
    let relayUrl = newRelay.trim();
    if (!relayUrl.startsWith("wss://") && !relayUrl.startsWith("ws://")) {
      relayUrl = `wss://${relayUrl}`;
    }
    
    setIsAdding(true);
    
    try {
      if (isOwnProfile) {
        // Add to user's relays (will also publish relay list)
        const success = await addUserRelay(relayUrl);
        
        if (success) {
          setNewRelay("");
        }
      } else {
        // Just connect to the relay temporarily
        const success = await nostrService.addRelay(relayUrl, true);
        
        if (success) {
          toast.success(`Connected to relay: ${relayUrl}`);
          setNewRelay("");
        } else {
          toast.error(`Failed to connect to relay: ${relayUrl}`);
        }
      }
    } catch (error) {
      console.error("Error adding relay:", error);
      toast.error("Failed to add relay");
    } finally {
      setIsAdding(false);
    }
  };
  
  const handleRemoveRelay = async (relayUrl: string) => {
    try {
      if (isOwnProfile) {
        // Remove from user's relays
        await removeUserRelay(relayUrl);
      } else {
        // Just disconnect from the relay
        nostrService.removeRelay(relayUrl);
        toast.success(`Disconnected from relay: ${relayUrl}`);
      }
    } catch (error) {
      console.error("Error removing relay:", error);
      toast.error("Failed to remove relay");
    }
  };
  
  const handleConnectToAllRelays = async () => {
    try {
      // Convert user's hex pubkey to npub
      const hexPubkey = nostrService.getHexFromNpub(npub);
      
      // Get relays for the profile
      const relayData = await nostrService.getRelaysForUser(hexPubkey);
      
      if (relayData && Object.keys(relayData).length > 0) {
        // Extract relay URLs
        const relaysToConnect = Object.keys(relayData);
        
        // Connect to all relays
        toast.info(`Connecting to ${relaysToConnect.length} relays...`);
        
        await nostrService.addMultipleRelays(relaysToConnect);
        toast.success(`Connected to ${relaysToConnect.length} relays`);
      } else {
        toast.info("No custom relays found for this profile");
      }
    } catch (error) {
      console.error("Error connecting to relays:", error);
      toast.error("Failed to connect to relays");
    }
  };
  
  // Helper to get a short display version of a relay URL
  const getShortRelayUrl = (url: string): string => {
    try {
      const hostname = new URL(url).hostname;
      return hostname;
    } catch (e) {
      return url;
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isOwnProfile ? "Manage Your Relays" : "User's Relays"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new relay input (only shown for own profile) */}
          {isOwnProfile && (
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter relay URL (e.g., wss://relay.nostr.org)"
                value={newRelay}
                onChange={(e) => setNewRelay(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddRelay()}
              />
              <Button 
                size="icon"
                onClick={handleAddRelay}
                disabled={!newRelay || isAdding}
              >
                {isAdding || adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
          
          {/* Connect to all relays button (only shown for other profiles) */}
          {!isOwnProfile && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleConnectToAllRelays}
            >
              Connect to all relays
            </Button>
          )}
          
          {/* List of relays */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              {loadingProfileRelays ? "Loading relays..." : `${userRelays.length} Relays`}
            </h3>
            
            {loadingProfileRelays ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : userRelays.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">
                No custom relays {isOwnProfile ? "configured" : "found for this user"}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userRelays.map((relay) => (
                  <Badge key={relay} variant="secondary" className="px-2 py-1 text-xs">
                    {getShortRelayUrl(relay)}
                    
                    {/* Remove button (only for own profile) */}
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 p-0 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleRemoveRelay(relay)}
                        disabled={removing}
                      >
                        {removing ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Relays are used to connect to the Nostr network.</p>
            {isOwnProfile && (
              <p className="mt-1">
                Adding or removing relays will publish a NIP-65 relay list to your connected relays.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
