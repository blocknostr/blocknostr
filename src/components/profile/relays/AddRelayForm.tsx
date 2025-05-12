
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { toast } from "sonner";

interface AddRelayFormProps {
  onRelayAdded: () => void;
}

export const AddRelayForm = ({ onRelayAdded }: AddRelayFormProps) => {
  const [newRelayUrl, setNewRelayUrl] = useState("");
  const [isAddingRelay, setIsAddingRelay] = useState(false);

  // Handle adding a single relay
  const handleAddRelay = async () => {
    if (!newRelayUrl.trim()) return;
    
    setIsAddingRelay(true);
    
    try {
      const success = await nostrService.addRelay(newRelayUrl);
      if (success) {
        toast.success(`Added relay: ${newRelayUrl}`);
        setNewRelayUrl("");
        onRelayAdded();
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

  return (
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
  );
};
