import { useState } from "react";
import { nostrService } from "@/lib/nostr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Relay } from "@/lib/nostr";
import { toast } from "sonner";
import { RelayDialogContent } from "./relays/DialogContent";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { RelayList } from "./relays/RelayList";
import { adaptedNostrService } from "@/lib/nostr/nostr-adapter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

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
    // Remove from nostr service
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
    
    // Enhance with performance data if available
    const enhancedRelays: Relay[] = relayStatus.map(relay => {
      // Add defaults for extended properties
      return {
        ...relay,
        score: relay.score !== undefined ? relay.score : 50,
        avgResponse: relay.avgResponse !== undefined ? relay.avgResponse : undefined
      };
    });
    
    if (onRelaysChange) {
      onRelaysChange(enhancedRelays);
    }
  };

  // Save relay list to NIP-65 event with improved error handling
  const handleSaveRelayList = async (relaysToSave: Relay[]): Promise<boolean> => {
    if (!isCurrentUser || relaysToSave.length === 0) return false;
    
    setIsPublishing(true);
    
    try {
      // Sort relays by performance score before saving
      const sortedRelays = [...relaysToSave].sort((a, b) => {
        // Sort by score if available
        if (a.score !== undefined && b.score !== undefined) {
          return b.score - a.score;
        }
        // Otherwise sort by status (connected first)
        return a.status === 'connected' ? -1 : 1;
      });
      
      // First ensure we're connected to relays
      await nostrService.connectToUserRelays();
      
      // Format relays for publishing
      const formattedRelays = sortedRelays.map(relay => ({
        url: relay.url,
        read: relay.read !== undefined ? relay.read : true,
        write: relay.write !== undefined ? relay.write : true
      }));
      
      // Use the imported adapatedNostrService directly
      const success = await adaptedNostrService.publishRelayList(formattedRelays);
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
      // Get current relay list
      const currentRelays = relays.map(relay => relay.url);
      
      // First, ensure we're connected to some relays
      await nostrService.connectToUserRelays();
      
      // If this is another user's profile, try to get their relay preferences
      if (!isCurrentUser && userNpub) {
        try {
          const hexPubkey = nostrService.getHexFromNpub(userNpub);
          if (hexPubkey) {
            const userRelays = await adaptedNostrService.getRelaysForUser(hexPubkey);
            if (userRelays && userRelays.length > 0) {
              console.log(`Found ${userRelays.length} relays for user ${userNpub}`);
            }
          }
        } catch (err) {
          console.error("Error fetching user relays:", err);
        }
      }
      
      // Update relay statuses
      handleRelayChange();
      
      toast.success("Refreshed relay connections");
    } catch (error) {
      console.error("Error refreshing relays:", error);
      toast.error("Failed to refresh relay connections");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check if any relays have a "failed" status
  const hasFailedRelays = relays.some(relay => 
    relay.status === "error" || relay.status === "disconnected" || relay.status === "failed"
  );

  // Calculate relay statistics
  const connectedCount = relays.filter(relay => relay.status === "connected").length;
  const totalCount = relays.length;
  const percentConnected = totalCount > 0 ? Math.round((connectedCount / totalCount) * 100) : 0;

  // Sort relays by performance metrics first
  const sortedRelays = [...relays].sort((a, b) => {
    // First by status (connected first)
    if (a.status === "connected" && b.status !== "connected") return -1;
    if (a.status !== "connected" && b.status === "connected") return 1;
    
    // Then by score
    if (a.score !== undefined && b.score !== undefined) {
      return b.score - a.score;
    }
    
    // Finally by URL
    return a.url.localeCompare(b.url);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Relay Connections</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={percentConnected > 70 ? "success" : percentConnected > 40 ? "warning" : "destructive"}>
                {connectedCount}/{totalCount} Connected ({percentConnected}%)
              </Badge>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshRelays}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          
          {hasFailedRelays && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md text-amber-800 dark:text-amber-300 flex items-center text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span>Some relays failed to connect. Try refreshing or check your connection.</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Relay connection failures can be caused by network issues, relay downtime, 
                    or relay restrictions. Try adding more relays for better network stability.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </DialogHeader>

        {/* Relay management content */}
        <RelayDialogContent 
          relays={sortedRelays}
          isCurrentUser={isCurrentUser}
          onRelayChange={handleRelayChange}
          onRemoveRelay={handleRemoveRelay}
          onSaveRelayList={handleSaveRelayList}
          isPublishing={isPublishing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
