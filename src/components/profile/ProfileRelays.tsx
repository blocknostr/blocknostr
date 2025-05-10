
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, ExternalLink } from "lucide-react";
import { Relay, nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface ProfileRelaysProps {
  relays: Relay[];
  onRelaysChange: (relays: Relay[]) => void;
}

const ProfileRelays = ({ relays, onRelaysChange }: ProfileRelaysProps) => {
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    if (!newRelayUrl.startsWith('wss://')) {
      toast.error("Relay URL must start with wss://");
      return;
    }
    
    setIsAddingRelay(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      if (success) {
        toast.success(`Added relay: ${newRelayUrl}`);
        setNewRelayUrl("");
        // Update relay status
        const relayStatus = nostrService.getRelayStatus();
        onRelaysChange(relayStatus);
        setDialogOpen(false);
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
    onRelaysChange(relayStatus);
    toast.success(`Removed relay: ${relayUrl}`);
  };
  
  const fetchNip05Relays = async () => {
    if (!nostrService.publicKey) {
      toast.error("You need to be logged in to fetch NIP-05 relays");
      return;
    }
    
    try {
      const profile = await nostrService.getUserProfile(nostrService.publicKey);
      
      if (!profile?.nip05) {
        toast.warning("No NIP-05 identifier found in your profile");
        return;
      }
      
      const nip05Data = await nostrService.fetchNip05Data(profile.nip05);
      
      if (!nip05Data?.relays || Object.keys(nip05Data.relays).length === 0) {
        toast.warning("No relays found in your NIP-05 configuration");
        return;
      }
      
      // Add each relay from NIP-05
      let addedCount = 0;
      for (const [relayUrl, _] of Object.entries(nip05Data.relays)) {
        try {
          const added = await nostrService.addRelay(relayUrl);
          if (added) addedCount++;
        } catch (e) {
          console.error(`Error adding relay ${relayUrl}:`, e);
        }
      }
      
      // Update relay status
      const relayStatus = nostrService.getRelayStatus();
      onRelaysChange(relayStatus);
      
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} relays from your NIP-05 identifier`);
      } else {
        toast.info("No new relays were added from your NIP-05 identifier");
      }
    } catch (error) {
      console.error("Error fetching NIP-05 relays:", error);
      toast.error("Failed to fetch relays from NIP-05 identifier");
    }
  };
  
  return (
    <div className="mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">My Relays</h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={fetchNip05Relays}
                title="Import relays from your NIP-05 identifier"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Import NIP-05 Relays
              </Button>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Add Relay
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a new relay</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-2 mt-4">
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
                    <div className="text-xs text-muted-foreground mb-2">
                      Relay URLs should start with wss:// and be trusted by both you and your contacts
                    </div>
                    <Button 
                      onClick={handleAddRelay}
                      disabled={isAddingRelay || !newRelayUrl.trim()}
                    >
                      {isAddingRelay ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Relay
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <div className="space-y-2">
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
                    <span className="text-sm font-mono">{relay.url}</span>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileRelays;
