import { useState } from 'react';
import { Relay } from '@/lib/nostr';
import { adaptedNostrService } from '@/lib/nostr/nostr-adapter';
import { relaySelector } from '@/lib/nostr/relay/selection/relay-selector';
import { toast } from 'sonner';

/**
 * Hook to manage publishing relay lists
 */
export function useRelayPublishing() {
  const [isPublishing, setIsPublishing] = useState(false);

  /**
   * Publish user's relay preferences (NIP-65) with smart selection
   */
  const publishRelayList = async (relays: Relay[]): Promise<boolean> => {
    if (!relays.length) return false;
    
    setIsPublishing(true);
    
    try {
      // Sort relays by performance score before publishing
      const sortedRelays = [...relays].sort((a, b) => {
        // Sort by score if available
        if (a.score !== undefined && b.score !== undefined) {
          return b.score - a.score;
        }
        // Otherwise sort by status (connected first)
        return a.status === 'connected' ? -1 : 1;
      });
      
      // Use the enhanced adapter method
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

  return {
    isPublishing,
    publishRelayList
  };
}
