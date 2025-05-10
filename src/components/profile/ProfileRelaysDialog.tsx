
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { Relay, nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface ProfileRelaysDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relays: Relay[];
  onRelaysChange?: (relays: Relay[]) => void;
}

const ProfileRelaysDialog = ({
  open,
  onOpenChange,
  relays,
  onRelaysChange,
}: ProfileRelaysDialogProps) => {
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Manage Relays</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
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
          
          <div className="text-xs text-muted-foreground">
            Relay URLs should start with wss:// and be trusted by both you and your contacts
          </div>
          
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {relays.length === 0 ? (
              <p className="text-sm text-muted-foreground">No relays connected</p>
            ) : (
              relays.map((relay) => (
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
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                    onClick={() => handleRemoveRelay(relay.url)}
                  >
                    Remove
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
