
import { nostrService } from "@/lib/nostr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Relay } from "@/lib/nostr";
import { toast } from "sonner";
import { RelayDialogContent } from "./relays/DialogContent";

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
  
  // Handle removing a relay
  const handleRemoveRelay = (relayUrl: string) => {
    nostrService.removeRelay(relayUrl);
    // Update relay status
    const relayStatus = nostrService.getRelayStatus();
    if (onRelaysChange) {
      onRelaysChange(relayStatus);
    }
    toast.success(`Removed relay: ${relayUrl}`);
  };

  // Handle relay changes
  const handleRelayChange = () => {
    const relayStatus = nostrService.getRelayStatus();
    if (onRelaysChange) {
      onRelaysChange(relayStatus);
    }
  };

  // Save relay list to NIP-65 event
  const handleSaveRelayList = async (relaysToSave: Relay[]): Promise<boolean> => {
    if (!isCurrentUser || relaysToSave.length === 0) return false;
    
    try {
      // Use the publishRelayList method if available
      if ('publishRelayList' in nostrService) {
        const success = await (nostrService as any).publishRelayList(relaysToSave);
        if (success) {
          toast.success("Relay preferences saved and published");
          return true;
        }
      } else {
        // Fallback to direct event publishing
        const success = await (nostrService as any).publishEvent({
          kind: 10002,
          content: '',
          tags: relaysToSave.map(relay => {
            const tag = ['r', relay.url];
            if (relay.read) tag.push('read');
            if (relay.write) tag.push('write');
            return tag;
          })
        });
        
        if (success) {
          toast.success("Relay preferences saved and published");
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error("Error saving relay preferences:", error);
      return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>{isCurrentUser ? "Manage Your Relays" : "User Relays"}</DialogTitle>
        </DialogHeader>
        
        <RelayDialogContent
          isCurrentUser={isCurrentUser}
          userNpub={userNpub}
          relays={relays}
          onRelayAdded={handleRelayChange}
          onRemoveRelay={handleRemoveRelay}
          onPublishRelayList={handleSaveRelayList}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileRelaysDialog;
