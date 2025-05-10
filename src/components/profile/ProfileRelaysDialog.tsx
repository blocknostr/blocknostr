
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Network, Plus, Wifi, X } from "lucide-react";
import { Relay, nostrService } from "@/lib/nostr";
import { toast } from "sonner";

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
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);
  const [isImportingRelays, setIsImportingRelays] = useState(false);

  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    setIsAddingRelay(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      if (success) {
        toast.success(`Added relay: ${newRelayUrl}`);
        setNewRelayUrl("");
        // Update relay status
        const relayStatus = nostrService.getRelayStatus();
        if (onRelaysChange) {
          onRelaysChange(relayStatus);
        }
      } else {
        toast.error(`Failed to add relay: ${newRelayUrl}`);
      }
    } catch (error) {
      console.error("Error adding relay:", error);
      toast.error("Failed to add relay");
    } finally {
      setIsAddingRelay(false);
    }
  };
  
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    // Update relay status
    const relayStatus = nostrService.getRelayStatus();
    if (onRelaysChange) {
      onRelaysChange(relayStatus);
    }
    toast.success(`Removed relay: ${relayUrl}`);
  };

  const handleImportRelays = async () => {
    if (!userNpub || isCurrentUser) return;
    
    setIsImportingRelays(true);
    
    try {
      const userPubkey = nostrService.getHexFromNpub(userNpub);
      // Try to find the user's relays from their published relay list
      const relaysFound: string[] = [];
      
      // Subscribe to relay list events for this user
      const subInfo = nostrService.subscribe(
        [
          {
            kinds: [10050], // Relay list event kind
            authors: [userPubkey],
            limit: 1
          }
        ],
        (event) => {
          // Extract relay URLs from r tags
          const relayTags = event.tags.filter(tag => tag[0] === 'r' && tag.length >= 2);
          relayTags.forEach(tag => {
            if (tag[1] && typeof tag[1] === 'string') {
              relaysFound.push(tag[1]);
            }
          });
        }
      );
      
      // Wait a bit to collect relays
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Unsubscribe
      if (subInfo && typeof subInfo.unsubscribe === 'function') {
        subInfo.unsubscribe();
      }
      
      if (relaysFound.length === 0) {
        toast.info("No relays found for this user");
        setIsImportingRelays(false);
        return;
      }
      
      // Add all found relays one by one
      let successCount = 0;
      for (const url of relaysFound) {
        try {
          const success = await nostrService.addRelay(url);
          if (success) successCount++;
        } catch (error) {
          console.error(`Failed to add relay ${url}:`, error);
        }
      }
      
      if (successCount > 0) {
        toast.success(`Added ${successCount} relays from ${userNpub}`);
        // Update relay status
        const relayStatus = nostrService.getRelayStatus();
        if (onRelaysChange) {
          onRelaysChange(relayStatus);
        }
      } else {
        toast.error("Failed to add any relays");
      }
    } catch (error) {
      console.error("Error importing relays:", error);
      toast.error("Failed to import relays");
    } finally {
      setIsImportingRelays(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isCurrentUser ? "Manage Your Relays" : "User Relays"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {isCurrentUser ? (
            <div className="flex gap-2">
              <Input
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isAddingRelay && newRelayUrl.trim()) {
                    handleAddRelay();
                  }
                }}
              />
              <Button 
                onClick={handleAddRelay}
                disabled={isAddingRelay || !newRelayUrl.trim()}
              >
                {isAddingRelay ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add
              </Button>
            </div>
          ) : userNpub ? (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={handleImportRelays}
                disabled={isImportingRelays}
              >
                {isImportingRelays ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Network className="h-4 w-4 mr-2" />
                )}
                Import These Relays
              </Button>
            </div>
          ) : null}
          
          {isCurrentUser && (
            <div className="text-xs text-muted-foreground">
              Relay URLs should start with wss:// and be trusted by both you and your contacts
            </div>
          )}
          
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {relays.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Wifi className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p>No relays connected</p>
                <p className="text-xs mt-1">
                  {isCurrentUser 
                    ? "Add a relay above to start connecting" 
                    : "This user hasn't shared their relay list"}
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm font-medium text-center mb-2">
                  Connected to {relays.filter(r => r.status === 'connected').length} of {relays.length} relays
                </div>
                {relays.map((relay) => (
                  <div 
                    key={relay.url} 
                    className="flex items-center justify-between bg-muted/50 p-3 rounded hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        relay.status === 'connected' ? 'bg-green-500' : 
                        relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      <span className="text-sm font-mono truncate max-w-[300px]">{relay.url}</span>
                    </div>
                    {isCurrentUser && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                        onClick={() => handleRemoveRelay(relay.url)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
