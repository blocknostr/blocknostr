import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Loader2, Network, Plus, Wifi, X } from "lucide-react";
import { Relay, nostrService } from "@/lib/nostr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  const [newRelayPermissions, setNewRelayPermissions] = useState({
    read: true,
    write: true
  });

  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    setIsAddingRelay(true);
    
    try {
      // Use the updated addRelay method with proper types
      const success = await nostrService.addRelay(newRelayUrl, newRelayPermissions);
      if (success) {
        toast.success(`Added relay: ${newRelayUrl}`);
        setNewRelayUrl("");
        setNewRelayPermissions({ read: true, write: true });
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
  
  const handleUpdateRelayPermissions = (relayUrl: string, permissions: {read: boolean; write: boolean}) => {
    // Use the public method on NostrService
    nostrService.updateRelayPermissions(relayUrl, permissions);
    // Update relay status
    const relayStatus = nostrService.getRelayStatus();
    if (onRelaysChange) {
      onRelaysChange(relayStatus);
    }
    toast.success(`Updated permissions for ${relayUrl}`);
  };

  const handleImportRelays = async () => {
    if (!userNpub || isCurrentUser) return;
    
    setIsImportingRelays(true);
    
    try {
      const userPubkey = nostrService.getHexFromNpub(userNpub);
      // Use the public method on NostrService
      const userRelays = await nostrService.getRelaysForUser(userPubkey);
      
      if (userRelays.length === 0) {
        toast.info("No relays found for this user");
        setIsImportingRelays(false);
        return;
      }
      
      // Use the public method on NostrService
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isCurrentUser ? "Manage Your Relays" : "User Relays"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {isCurrentUser ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
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
                
                <div className="flex flex-col space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="read-permission"
                      checked={newRelayPermissions.read}
                      onCheckedChange={(checked) => 
                        setNewRelayPermissions(prev => ({...prev, read: checked}))
                      }
                    />
                    <Label htmlFor="read-permission">Read (receive notes from this relay)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="write-permission"
                      checked={newRelayPermissions.write}
                      onCheckedChange={(checked) => 
                        setNewRelayPermissions(prev => ({...prev, write: checked}))
                      }
                    />
                    <Label htmlFor="write-permission">Write (publish notes to this relay)</Label>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddRelay}
                  disabled={isAddingRelay || !newRelayUrl.trim()}
                  className="w-full mt-2"
                >
                  {isAddingRelay ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Add Relay
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Relay URLs should start with wss:// and be trusted by both you and your contacts
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
                    className="flex items-center justify-between bg-muted/50 p-3 rounded hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        relay.status === 'connected' ? 'bg-green-500' : 
                        relay.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></span>
                      <span className="text-sm font-mono truncate max-w-[200px]">{relay.url}</span>
                      
                      <div className="flex gap-1 ml-2">
                        {relay.read && (
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            Read
                          </Badge>
                        )}
                        {relay.write && (
                          <Badge variant="outline" className="text-xs py-0 h-5">
                            Write
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {isCurrentUser && (
                      <div className="flex items-center gap-2">
                        {relay.status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-sm"
                            onClick={() => handleUpdateRelayPermissions(relay.url, {
                              read: !relay.read,
                              write: relay.write
                            })}
                          >
                            {relay.read ? "R ✓" : "R ✗"}
                          </Button>
                        )}
                        
                        {relay.status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-sm"
                            onClick={() => handleUpdateRelayPermissions(relay.url, {
                              read: relay.read,
                              write: !relay.write
                            })}
                          >
                            {relay.write ? "W ✓" : "W ✗"}
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-100/10"
                          onClick={() => handleRemoveRelay(relay.url)}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
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
