import { useState } from "react";
import { nostrService } from "@/lib/nostr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Relay } from "@/lib/nostr";
import { toast } from "sonner";
import { RelayDialogContent } from "./DialogContent";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { RelayList } from "./RelayList";
import { adaptedNostrService } from "@/lib/nostr/nostr-adapter";
import { relayPerformanceTracker } from "@/lib/nostr/relay/performance/relay-performance-tracker";
import { relaySelector } from "@/lib/nostr/relay/selection/relay-selector";
import { circuitBreaker } from "@/lib/nostr/relay/circuit/circuit-breaker";
import { CircuitState } from "@/lib/nostr/relay/circuit/circuit-breaker";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { RelayScoreBadge } from "./RelayScoreBadge";
import { CircuitBreakerAlert } from "./CircuitBreakerAlert";
import { RelayActionButtons } from "./RelayActionButtons";

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
    // Record the removal in the circuit breaker system
    circuitBreaker.reset(relayUrl);
    
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
    
    // Enhance with performance data
    const enhancedRelays = relayStatus.map(relay => {
      const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
      const circuitStatus = circuitBreaker.getState(relay.url);
      
      return {
        ...relay,
        score: perfData?.score || 50,
        avgResponse: perfData?.avgResponseTime,
        circuitStatus
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
      
      // Use the best relays for write operations
      const bestWriteRelays = relaySelector.selectBestRelays(
        sortedRelays.map(r => r.url),
        { operation: 'write', count: 3, requireWriteSupport: true }
      );
      
      // Add these write-optimized relays first
      if (bestWriteRelays.length > 0) {
        await adaptedNostrService.addMultipleRelays(bestWriteRelays);
      }
      
      // Use the imported adapatedNostrService directly
      const success = await adaptedNostrService.publishRelayList(sortedRelays);
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
  
  // Handle refreshing relay connections with smart selection
  const handleRefreshRelays = async () => {
    setIsRefreshing(true);
    
    try {
      // Get current relay list
      const currentRelays = relays.map(relay => relay.url);
      
      // First, ensure we're connected to some relays
      await nostrService.connectToUserRelays();
      
      // Calculate which relays to prioritize
      const prioritizedRelays = relaySelector.selectBestRelays(currentRelays, {
        operation: 'both',
        count: Math.min(5, currentRelays.length),
        minScore: 0  // Include all relays since this is explicitly requested
      });
      
      // Try to connect to prioritized relays first
      if (prioritizedRelays.length > 0) {
        const connectPromises = prioritizedRelays.map(relay => 
          adaptedNostrService.addRelay(relay).catch(err => {
            console.warn(`Failed to connect to relay ${relay}:`, err);
            return false;
          })
        );
        
        // Wait for prioritized connections to complete
        await Promise.allSettled(connectPromises);
      }
      
      // If this is another user's profile, try to get their relay preferences
      if (!isCurrentUser && userNpub) {
        try {
          const hexPubkey = nostrService.getHexFromNpub(userNpub);
          if (hexPubkey) {
            const userRelays = await adaptedNostrService.getRelaysForUser(hexPubkey);
            if (userRelays && userRelays.length > 0) {
              console.log(`Found ${userRelays.length} relays for user ${userNpub}`);
              
              // Try connecting to these user-specific relays
              await adaptedNostrService.addMultipleRelays(userRelays);
            }
          }
        } catch (error) {
          console.warn(`Failed to get relays for user ${userNpub}:`, error);
        }
      }
      
      // Get updated relay status with performance data
      const updatedRelays = nostrService.getRelayStatus().map(relay => {
        const perfData = relayPerformanceTracker.getRelayPerformance(relay.url);
        return {
          ...relay,
          score: perfData?.score || 50,
          avgResponse: perfData?.avgResponseTime
        };
      });
      
      if (onRelaysChange) {
        onRelaysChange(updatedRelays);
      }
      
      toast.success("Relay connections refreshed");
    } catch (error) {
      console.error("Error refreshing relay connections:", error);
      toast.error("Failed to refresh relay connections");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check for circuit breaker status
  const hasBlockedRelays = relays.some(relay => {
    const state = circuitBreaker.getState(relay.url);
    return state === CircuitState.OPEN;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {isCurrentUser ? "My Relays" : "User Relays"}
            <RelayActionButtons 
              onRefresh={handleRefreshRelays}
              isRefreshing={isRefreshing}
            />
          </DialogTitle>
        </DialogHeader>
        
        <CircuitBreakerAlert hasBlockedRelays={hasBlockedRelays} />
        
        {isCurrentUser ? (
          <RelayDialogContent
            isCurrentUser={true}
            relays={relays}
            onRemoveRelay={handleRemoveRelay}
            onRelayAdded={handleRelayChange}
            onPublishRelayList={handleSaveRelayList}
            userNpub={userNpub}
            renderRelayScore={(relay) => <RelayScoreBadge relay={relay} />}
          />
        ) : (
          <div className="space-y-4 py-4">
            <div className="text-sm text-muted-foreground mb-2">
              Relays used by {userNpub ? userNpub.substring(0, 8) + "..." : "this user"}
            </div>
            
            <RelayList 
              relays={relays} 
              isCurrentUser={false}
              renderRelayScore={(relay) => <RelayScoreBadge relay={relay} />}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
