
import { useState } from "react";
import { nostrService } from "@/lib/nostr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Relay } from "@/lib/nostr";
import { toast } from "sonner";
import { RelayDialogContent } from "./relays/DialogContent";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { RelayList } from "./relays/RelayList";
import { adaptedNostrService } from "@/lib/nostr/nostr-adapter";

interface ProfileRelaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relays: Relay[];
  onRelaysChange?: (relays: Relay[]) => void;
  isCurrentUser: boolean;
  userNpub?: string;
}

const ProfileRelaysDialog = ({
  open,
  onOpenChange,
  relays,
  onRelaysChange,
  isCurrentUser,
  userNpub
}: ProfileRelaysDialogProps) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Handle removing a relay
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    // Update relay status
    const relayStatus = nostrService.getRelayStatus();
    if (onRelaysChange) {
      onRelaysChange(relayStatus);
    }
    toast.success(`Removed relay: ${relayUrl}`);
  };

  // Handle relay changes
  const handleRelayChange = () => {
    const relayStatus = nostrService.getRelayStatus();
    if (onRelaysChange) {
      onRelaysChange(relayStatus);
    }
  };

  // Save relay list to NIP-65 event with improved error handling
  const handleSaveRelayList = async (relaysToSave: Relay[]): Promise<boolean> => {
    if (!isCurrentUser || relaysToSave.length === 0) return false;
    
    setIsPublishing(true);
    
    try {
      // First ensure we're connected to relays
      await nostrService.connectToUserRelays();
      
      // Use the imported adapatedNostrService directly
      const success = await adaptedNostrService.publishRelayList(relaysToSave);
      if (success) {
        toast.success("Relay preferences updated");
        return true;
      } else {
        toast.error("Failed to update relay preferences");
        return false;
      }
    } catch (error) {
      console.error("Error publishing relay list:", error);
      toast.error("Failed to update relay preferences");
      return false;
    } finally {
      setIsPublishing(false);
    }
  };
  
  // Handle refreshing relay connections
  const handleRefreshRelays = async () => {
    setIsRefreshing(true);
    
    try {
      // Ensure we're connected to relays
      await nostrService.connectToUserRelays();
      
      // Try to connect to all relays in the list
      const connectPromises = relays.map(relay => 
        nostrService.connectToRelay(relay.url).catch(err => {
          console.warn(`Failed to connect to relay ${relay.url}:`, err);
          return false;
        })
      );
      
      // Wait for all connection attempts to complete
      await Promise.all(connectPromises);
      
      // Get updated relay status
      const relayStatus = nostrService.getRelayStatus();
      if (onRelaysChange) {
        onRelaysChange(relayStatus);
      }
      
      toast.success("Relay connections refreshed");
    } catch (error) {
      console.error("Error refreshing relay connections:", error);
      toast.error("Failed to refresh relay connections");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCurrentUser ? "My Relays" : "User Relays"}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefreshRelays}
              disabled={isRefreshing}
              className="ml-2 h-7 px-2"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {isCurrentUser ? (
          <RelayDialogContent
            isCurrentUser={true}
            relays={relays}
            onRemoveRelay={handleRemoveRelay}
            onRelayAdded={handleRelayChange}
            onPublishRelayList={handleSaveRelayList}
            userNpub={userNpub}
          />
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground mb-2">
              Relays used by {userNpub ? userNpub.substring(0, 8) + "..." : "this user"}
            </div>
            
            <RelayList 
              relays={relays} 
              isCurrentUser={false} 
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
