
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Network } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface ImportRelaysButtonProps {
  userNpub: string;
  onImportComplete: () => void;
}

export const ImportRelaysButton = ({ userNpub, onImportComplete }: ImportRelaysButtonProps) => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImportRelays = async () => {
    if (!userNpub) return;
    
    setIsImporting(true);
    
    try {
      const userPubkey = nostrService.getHexFromNpub(userNpub);
      // Use the NIP-65 compliant method
      const userRelays = await nostrService.getRelaysForUser(userPubkey);
      
      if (userRelays.length === 0) {
        toast.info("No relays found for this user");
        setIsImporting(false);
        return;
      }
      
      // Add all found relays
      const successCount = await nostrService.addMultipleRelays(userRelays);
      
      // Check if any relays were added successfully
      if (successCount !== 0) {  // Fixed comparison to use !== 0 instead of > 0
        toast.success(`Added ${successCount} relays from ${userNpub}`);
        onImportComplete();
      } else {
        toast.error("Failed to add any relays");
      }
    } catch (error) {
      console.error("Error importing relays:", error);
      toast.error("Failed to import relays");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        onClick={handleImportRelays}
        disabled={isImporting}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Network className="h-4 w-4 mr-2" />
        )}
        Import These Relays
      </Button>
    </div>
  );
};
