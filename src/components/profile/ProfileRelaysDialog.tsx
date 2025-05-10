
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Network, Plus, Shield, ShieldCheck, ShieldOff, ShieldX, Wifi, X } from "lucide-react";
import { Relay, nostrService, RelayTrustLevel } from "@/lib/nostr";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  const [selectedTrustLevel, setSelectedTrustLevel] = useState<string>(RelayTrustLevel.Default.toString());
  const [testingRelays, setTestingRelays] = useState<Set<string>>(new Set());
  const [relayLatencies, setRelayLatencies] = useState<Record<string, number>>({});

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
            true, 
            trustLevel >= RelayTrustLevel.Trusted
          );
        }
        
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
  
  const handleUpdateTrust = async (relayUrl: string, trustLevel: number) => {
    try {
      const read = trustLevel >= RelayTrustLevel.ReadOnly;
      const write = trustLevel >= RelayTrustLevel.Trusted;
      
      await nostrService.updateRelayTrust(relayUrl, trustLevel, read, write);
      
      // Update relay status
      const relayStatus = nostrService.getRelayStatus();
      if (onRelaysChange) {
        onRelaysChange(relayStatus);
      }
      
      toast.success(`Updated trust level for ${relayUrl}`);
    } catch (error) {
      console.error("Error updating relay trust:", error);
      toast.error("Failed to update trust level");
    }
  };

  const handleImportRelays = async () => {
    if (!userNpub || isCurrentUser) return;
    
    setIsImportingRelays(true);
    
    try {
      const userPubkey = nostrService.getHexFromNpub(userNpub);
      // Try to find the user's relays
      const userRelays = await nostrService.getRelaysForUser(userPubkey);
      
      if (userRelays.length === 0) {
        toast.info("No relays found for this user");
        setIsImportingRelays(false);
        return;
      }
      
      // Add all found relays
      const successCount = await nostrService.addMultipleRelays(userRelays);
      
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
  
  const testRelayConnection = async (relayUrl: string) => {
    if (testingRelays.has(relayUrl)) return;
    
    const updatedTestingRelays = new Set(testingRelays);
    updatedTestingRelays.add(relayUrl);
    setTestingRelays(updatedTestingRelays);
    
    try {
      const latency = await nostrService.testRelayConnection(relayUrl);
      
      // Update latencies state
      setRelayLatencies(prev => ({
        ...prev,
        [relayUrl]: latency
      }));
      
      // Update relay status
      const relayStatus = nostrService.getRelayStatus();
      if (onRelaysChange) {
        onRelaysChange(relayStatus);
      }
      
    } catch (error) {
      console.error(`Error testing relay ${relayUrl}:`, error);
      toast.error(`Failed to connect to ${relayUrl}`);
    } finally {
      const finishedTestingRelays = new Set(testingRelays);
      finishedTestingRelays.delete(relayUrl);
      setTestingRelays(finishedTestingRelays);
    }
  };
  
  const getTrustLevelIcon = (url: string) => {
    const trustLevel = nostrService.getRelayTrustLevel(url);
    
    switch (trustLevel) {
      case RelayTrustLevel.Untrusted:
        return <ShieldX className="h-4 w-4 text-red-500" />;
      case RelayTrustLevel.ReadOnly:
        return <ShieldOff className="h-4 w-4 text-yellow-500" />;
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isCurrentUser ? "Manage Your Relays" : "User Relays"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {isCurrentUser ? (
            <div className="space-y-2">
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
              
              <Select
                value={selectedTrustLevel}
                onValueChange={setSelectedTrustLevel}
              >
                <SelectTrigger id="trust-level">
                  <SelectValue placeholder="Select trust level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Default Trust</SelectItem>
                  <SelectItem value="1">Untrusted</SelectItem>
                  <SelectItem value="2">Read Only</SelectItem>
                  <SelectItem value="3">Trusted</SelectItem>
                  <SelectItem value="4">Personal</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="text-xs text-muted-foreground pb-2">
                <p>Relay trust levels are based on NIP-B7 standard:</p>
                <ul className="space-y-1 mt-1">
                  <li className="flex items-center gap-1">
                    <ShieldX className="h-3 w-3 text-red-500" /> 
                    <span>Untrusted: No data sent or received</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <ShieldOff className="h-3 w-3 text-yellow-500" /> 
                    <span>Read Only: Only read from this relay</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <Shield className="h-3 w-3 text-green-500" /> 
                    <span>Trusted: Read and write public content</span>
                  </li>
                  <li className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3 text-blue-500" /> 
                    <span>Personal: Read, write and share private data</span>
                  </li>
                </ul>
              </div>
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
                    className="flex flex-col bg-muted/50 p-3 rounded hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${
                          relay.status === 'connected' ? 'bg-green-500' : 
                          relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></span>
                        <span className="text-sm font-mono truncate max-w-[240px]">{relay.url}</span>
                        
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
                        
                        {relayLatencies[relay.url] && (
                          <Badge variant="outline" className="text-xs">
                            {relayLatencies[relay.url]}ms
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCurrentUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/10"
                            onClick={() => testRelayConnection(relay.url)}
                            disabled={testingRelays.has(relay.url)}
                          >
                            {testingRelays.has(relay.url) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span className="sr-only">Test</span>
                          </Button>
                        )}
                        
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
                    </div>
                    
                    {isCurrentUser && (
                      <div className="mt-2 flex items-center">
                        <Select
                          defaultValue={nostrService.getRelayTrustLevel(relay.url).toString()}
                          onValueChange={(value) => handleUpdateTrust(relay.url, parseInt(value))}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <SelectValue placeholder="Trust Level" />
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
