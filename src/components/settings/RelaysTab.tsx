
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { nostrService, Relay } from "@/lib/nostr";
import { Plus, Trash2, Check, AlertCircle, Loader2, Network } from "lucide-react";
import { cn } from "@/lib/utils";

const RelaysTab = () => {
  const [relays, setRelays] = useState<Relay[]>([]);
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Load relays on component mount and set up refresh interval
  useEffect(() => {
    const loadRelays = () => {
      const relayStatus = nostrService.getRelayStatus();
      setRelays(relayStatus);
    };
    
    loadRelays();
    
    // Refresh relay status every 5 seconds
    const interval = setInterval(loadRelays, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    if (!newRelayUrl.startsWith("wss://")) {
      toast.error("Invalid relay URL", {
        description: "Relay URL must start with wss://"
      });
      return;
    }
    
    setIsConnecting(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      
      if (success) {
        toast.success("Relay connected", {
          description: `Successfully connected to ${newRelayUrl}`
        });
        setNewRelayUrl("");
        setRelays(nostrService.getRelayStatus());
      } else {
        toast.error("Connection failed", {
          description: `Could not connect to ${newRelayUrl}`
        });
      }
    } catch (error) {
      toast.error("Error connecting", {
        description: "An unexpected error occurred"
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    setRelays(nostrService.getRelayStatus());
    toast.success("Relay removed", {
      description: `Removed relay: ${relayUrl}`
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'connected':
        return "bg-green-500/5 border-green-500/20";
      case 'connecting':
        return "bg-yellow-500/5 border-yellow-500/20";
      default:
        return "bg-red-500/5 border-red-500/20";
    }
  };
  
  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-xl font-semibold">Relay Settings</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage the Nostr relays you connect to
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="newRelay" className="font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Relay
            </Label>
            <div className="flex items-center mt-1.5 gap-2">
              <Input 
                id="newRelay" 
                placeholder="wss://relay.example.com"
                value={newRelayUrl}
                onChange={(e) => setNewRelayUrl(e.target.value)}
                className="focus:ring-1 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRelayUrl.trim()) {
                    handleAddRelay();
                  }
                }}
              />
              <Button 
                onClick={handleAddRelay}
                size="icon"
                disabled={isConnecting}
                className="transition-all duration-200"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="font-medium flex items-center gap-2">
              <Network className="h-4 w-4" />
              Connected Relays
            </Label>
            
            {relays.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center justify-center p-6 border border-dashed rounded-md">
                <p>No relays connected yet. Add a relay above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar rounded-md border p-2">
                {relays.map((relay) => (
                  <div 
                    key={relay.url} 
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md transition-all",
                      getStatusClass(relay.status),
                      "hover:shadow-sm animate-fade-in"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getStatusIcon(relay.status)}
                      <span className="text-sm truncate">{relay.url}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500"
                        onClick={() => handleRemoveRelay(relay.url)}
                        title="Remove relay"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RelaysTab;
