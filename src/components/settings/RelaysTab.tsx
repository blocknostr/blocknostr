
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { nostrService, Relay } from "@/lib/nostr";
import { ExtendedRelay } from "@/lib/nostr/types/extended-relay";
import { Plus, Trash2 } from "lucide-react";

const RelaysTab = () => {
  const [relays, setRelays] = useState<ExtendedRelay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  
  // Load relays on component mount and set up refresh interval
  useEffect(() => {
    const loadRelays = () => {
      const relayStatus = nostrService.getRelayStatus();
      const extendedRelays: ExtendedRelay[] = relayStatus.map(relay => ({
        url: relay.url,
        read: true, // Default to true for UI
        write: true, // Default to true for UI
        status: relay.status,
        score: relay.score,
        avgResponse: relay.avgResponse
      }));
      setRelays(extendedRelays);
    };
    
    loadRelays();
    
    // Refresh relay status every 5 seconds
    const interval = setInterval(loadRelays, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    if (!newRelayUrl.startsWith("wss://")) {
      toast.error("Relay URL must start with wss://");
      return;
    }
    
    toast.loading("Connecting to relay...");
    const success = await nostrService.addRelay(newRelayUrl);
    
    if (success) {
      toast.success(`Connected to ${newRelayUrl}`);
      setNewRelayUrl("");
      
      const relayStatus = nostrService.getRelayStatus();
      const extendedRelays: ExtendedRelay[] = relayStatus.map(relay => ({
        url: relay.url,
        read: true, // Default to true for UI
        write: true, // Default to true for UI
        status: relay.status,
        score: relay.score,
        avgResponse: relay.avgResponse
      }));
      setRelays(extendedRelays);
    } else {
      toast.error(`Failed to connect to ${newRelayUrl}`);
    }
  };
  
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    
    const relayStatus = nostrService.getRelayStatus();
    const extendedRelays: ExtendedRelay[] = relayStatus.map(relay => ({
      url: relay.url,
      read: true, // Default to true for UI
      write: true, // Default to true for UI
      status: relay.status,
      score: relay.score,
      avgResponse: relay.avgResponse
    }));
    setRelays(extendedRelays);
    
    toast.success(`Removed relay: ${relayUrl}`);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relay Settings</CardTitle>
        <CardDescription>
          Manage the Nostr relays you connect to
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="newRelay">Add New Relay</Label>
            <div className="flex items-center mt-1.5 gap-2">
              <Input 
                id="newRelay" 
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRelayUrl.trim()) {
                    handleAddRelay();
                  }
                }}
              />
              <Button 
                onClick={handleAddRelay}
                size="icon"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Connected Relays</h3>
            <div className="space-y-2">
              {relays.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No relays connected yet. Add a relay above.
                </p>
              ) : (
                relays.map((relay) => (
                  <div 
                    key={relay.url} 
                    className="flex items-center justify-between border p-2 rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          relay.status === 'connected' ? 'bg-green-500' : 
                          relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                      ></div>
                      <span className="text-sm">{relay.url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => handleRemoveRelay(relay.url)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RelaysTab;
