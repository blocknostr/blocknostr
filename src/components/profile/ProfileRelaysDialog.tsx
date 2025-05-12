import { useState } from "react";
import { nostrService } from "@/lib/nostr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Relay, CircuitState } from "@/lib/nostr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { RelayList } from "./relays/RelayList";
import { adaptedNostrService } from "@/lib/nostr/nostr-adapter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

// Define EnhancedRelay interface without extending Relay
export interface EnhancedRelay {
  url: string;
  read?: boolean;
  write?: boolean;
  status: "connecting" | "connected" | "disconnected" | "error" | "unknown" | "failed";
  score?: number;
  avgResponse?: number; 
  circuitStatus?: CircuitState;
  isRequired?: boolean;
}

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
    const enhancedRelays: EnhancedRelay[] = relayStatus.map(relay => {
      // Add defaults for extended properties
      return {
        ...relay,
        score: relay.score !== undefined ? relay.score : 50,
        avgResponse: relay.avgResponse !== undefined ? relay.avgResponse : undefined,
        circuitStatus: 'closed' as CircuitState // Default to closed
      };
    });
    
    if (onRelaysChange) {
      // Since we're enhancing, this is safe to pass
      onRelaysChange(relayStatus);
    }
  };

  // Save relay list to NIP-65 event with improved error handling
  const handleSaveRelayList = async (relaysToSave: EnhancedRelay[]): Promise<boolean> => {
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
      
      // Use direct nostrService API instead of adapter
      const success = await nostrService.publishRelayList(formattedRelays);
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
            const userRelays = await nostrService.getRelaysForUser(hexPubkey);
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
    
    // Then by score if available
    const aScore = (a as any).score;
    const bScore = (b as any).score;
    if (aScore !== undefined && bScore !== undefined) {
      return bScore - aScore;
    }
    
    // Finally by URL
    return a.url.localeCompare(b.url);
  });

  const getBadgeVariant = (percentage: number) => {
    if (percentage > 70) return "outline"; // Using supported variant
    if (percentage > 40) return "secondary"; // Using supported variant
    return "destructive"; // Using supported variant
  };

  // Convert relays to EnhancedRelay type for the RelayList component
  const enhancedRelays: EnhancedRelay[] = sortedRelays.map(relay => ({
    ...relay,
    score: (relay as any).score || 50,
    avgResponse: (relay as any).avgResponse,
    circuitStatus: (relay as any).circuitStatus || 'closed' as CircuitState,
    isRequired: (relay as any).isRequired || false
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Relay Connections</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getBadgeVariant(percentConnected)}>
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

        {/* Simple relay list */}
        <div className="space-y-4">
          <RelayList
            relays={enhancedRelays}
            onRemoveRelay={handleRemoveRelay}
            isCurrentUser={isCurrentUser}
          />
          
          {isCurrentUser && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="default"
                onClick={() => handleSaveRelayList(enhancedRelays)}
                disabled={isPublishing}
              >
                {isPublishing ? 'Saving...' : 'Save Relay Preferences'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
