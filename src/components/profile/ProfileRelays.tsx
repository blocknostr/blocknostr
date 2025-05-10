
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Shield, ShieldCheck, ShieldOff, ShieldX } from "lucide-react";
import { Relay, nostrService, RelayTrustLevel } from "@/lib/nostr";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileRelaysProps {
  relays: Relay[];
  onRelaysChange: (relays: Relay[]) => void;
}

const ProfileRelays = ({ relays, onRelaysChange }: ProfileRelaysProps) => {
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTrustLevel, setSelectedTrustLevel] = useState<string>(RelayTrustLevel.Default.toString());
  
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    setIsAddingRelay(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      if (success) {
        // Update trust level if different from default
        const trustLevel = parseInt(selectedTrustLevel);
        if (trustLevel !== RelayTrustLevel.Default) {
          await nostrService.updateRelayTrust(
            newRelayUrl, 
            trustLevel, 
            true,  // read 
            trustLevel >= RelayTrustLevel.Trusted // only write to trusted relays
          );
        }
        
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
  
  const handleUpdateTrust = async (relayUrl: string, trustLevel: RelayTrustLevel) => {
    try {
      const read = trustLevel >= RelayTrustLevel.ReadOnly;
      const write = trustLevel >= RelayTrustLevel.Trusted;
      
      await nostrService.updateRelayTrust(relayUrl, trustLevel, read, write);
      
      // Update relay status
      const relayStatus = nostrService.getRelayStatus();
      onRelaysChange(relayStatus);
      
      toast.success(`Updated trust level for ${relayUrl}`);
    } catch (error) {
      console.error("Error updating relay trust:", error);
      toast.error("Failed to update trust level");
    }
  };
  
  const getTrustLevelIcon = (url: string) => {
    const trustLevel = nostrService.getRelayTrustLevel(url);
    
    switch (trustLevel) {
      case RelayTrustLevel.Untrusted:
        return <ShieldX className="h-4 w-4 text-red-500" />;
      case RelayTrustLevel.ReadOnly:
        return <Shield className="h-4 w-4 text-yellow-500" />;
      case RelayTrustLevel.Trusted:
        return <Shield className="h-4 w-4 text-green-500" />;
      case RelayTrustLevel.Personal:
        return <ShieldCheck className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-400" />;
    }
  };
  
  const getTrustLevelLabel = (level: RelayTrustLevel) => {
    switch (level) {
      case RelayTrustLevel.Untrusted:
        return "Untrusted";
      case RelayTrustLevel.ReadOnly:
        return "Read Only";
      case RelayTrustLevel.Trusted:
        return "Trusted";
      case RelayTrustLevel.Personal:
        return "Personal";
      default:
        return "Default";
    }
  };
  
  return (
    <div className="mb-6">
      <Card>
        <CardContent className="pt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">My Relays</h3>
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
                  
                  <div className="flex flex-col gap-2 mt-2">
                    <label htmlFor="trust-level" className="text-sm font-medium">
                      Trust Level (NIP-B7)
                    </label>
                    <Select
                      value={selectedTrustLevel}
                      onValueChange={setSelectedTrustLevel}
                    >
                      <SelectTrigger id="trust-level">
                        <SelectValue placeholder="Select trust level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Default</SelectItem>
                        <SelectItem value="1">Untrusted</SelectItem>
                        <SelectItem value="2">Read Only</SelectItem>
                        <SelectItem value="3">Trusted</SelectItem>
                        <SelectItem value="4">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    <p>Relay URLs should start with wss:// and be trusted by both you and your contacts</p>
                    <p className="mt-1">Trust levels determine how your data is shared (NIP-B7):</p>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      <li>Untrusted: No data sent or received</li>
                      <li>Read Only: Only read from this relay</li>
                      <li>Trusted: Read and write public content</li>
                      <li>Personal: Read, write and share private data</li>
                    </ul>
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
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {getTrustLevelIcon(relay.url)}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Trust Level: {getTrustLevelLabel(nostrService.getRelayTrustLevel(relay.url))}</p>
                          <p className="text-xs text-muted-foreground">
                            {relay.read && relay.write ? "Read & Write" : relay.read ? "Read Only" : "No Access"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue={nostrService.getRelayTrustLevel(relay.url).toString()}
                      onValueChange={(value) => handleUpdateTrust(relay.url, parseInt(value))}
                    >
                      <SelectTrigger className="h-8 w-[110px]">
                        <SelectValue placeholder="Trust" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Default</SelectItem>
                        <SelectItem value="1">Untrusted</SelectItem>
                        <SelectItem value="2">Read Only</SelectItem>
                        <SelectItem value="3">Trusted</SelectItem>
                        <SelectItem value="4">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                      onClick={() => handleRemoveRelay(relay.url)}
                    >
                      Remove
                    </Button>
                  </div>
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
