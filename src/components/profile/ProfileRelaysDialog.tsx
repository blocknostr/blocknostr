import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { nostrService, Relay } from "@/lib/nostr";
import { ExtendedRelay } from "@/lib/nostr/types/extended-relay";
import { CircuitState } from "@/lib/nostr/relay/circuit/circuit-breaker";
import { format } from "date-fns";

interface ProfileRelaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pubkey: string;
}

const ProfileRelaysDialog = ({ open, onOpenChange, pubkey }: ProfileRelaysDialogProps) => {
  const [relays, setRelays] = useState<ExtendedRelay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  useEffect(() => {
    const fetchRelays = async () => {
      try {
        if (!open || !pubkey) return;
        
        setLoading(true);
        setError(null);
        
        // Fetch relays for the specified user
        let userRelays: Relay[] = [];
        try {
          userRelays = await nostrService.getRelaysForUser(pubkey);
        } catch (err) {
          console.error("Error fetching user relays:", err);
          setError("Failed to fetch relays for this user");
        }
        
        // Get current relay status for context
        const relayStatus = nostrService.getRelayStatus();
        
        // Convert relay status to the extended format
        const extendedRelays: ExtendedRelay[] = relayStatus.map(relay => ({
          url: relay.url,
          read: true, // Assume these are readable since they're in status
          write: true, // Assume these are writable since they're in status
          status: relay.status,
          score: relay.score || 50,
          avgResponse: relay.avgResponse
        }));
        
        // Add any missing relays from user's list
        userRelays.forEach(userRelay => {
          if (!extendedRelays.some(r => r.url === userRelay.url)) {
            extendedRelays.push({
              ...userRelay,
              score: 50, // Default score
              status: 'unknown'
            });
          }
        });
        
        // Sort relays: connected first, then by score
        const sortedRelays = extendedRelays.sort((a, b) => {
          // Connected relays first
          if (a.status === 1 && b.status !== 1) return -1;
          if (a.status !== 1 && b.status === 1) return 1;
          
          // Then sort by score (highest first)
          return (b.score || 0) - (a.score || 0);
        });
        
        setRelays(sortedRelays);
        setLastUpdated(new Date());
        
      } catch (err) {
        console.error("Error in relay dialog:", err);
        setError("Failed to load relay information");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRelays();
  }, [open, pubkey]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Relays for {pubkey.substring(0, 10)}...</DialogTitle>
          <DialogDescription>
            These are the relays this user has been seen publishing to.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="text-red-500 mt-2">
            Error: {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-32">
            Loading relay information...
          </div>
        ) : (
          <div className="divide-y divide-border">
            {relays.length > 0 ? (
              relays.map((relay) => (
                <div key={relay.url} className="py-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <a 
                        href={relay.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {relay.url}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        Score: {relay.score || 'N/A'}
                        {relay.avgResponse && `, Avg. Response: ${relay.avgResponse.toFixed(2)}ms`}
                      </div>
                    </div>
                    <div className="text-sm">
                      Status: {relay.status}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No relay information found for this user.
              </div>
            )}
          </div>
        )}
        
        {lastUpdated && (
          <div className="mt-2 text-xs text-muted-foreground text-right">
            Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm')}
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
