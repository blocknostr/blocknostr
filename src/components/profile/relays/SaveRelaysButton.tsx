
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { Relay } from "@/lib/nostr";
import { toast } from "sonner";

interface SaveRelaysButtonProps {
  relays: Relay[];
  onSave: (relays: Relay[]) => Promise<boolean>;
  disabled?: boolean;
}

export const SaveRelaysButton = ({ 
  relays, 
  onSave,
  disabled = false 
}: SaveRelaysButtonProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (disabled || relays.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const success = await onSave(relays);
      if (!success) {
        toast.error("Failed to save relay preferences");
      }
    } catch (error) {
      console.error("Error saving relay preferences:", error);
      toast.error("Failed to save relay preferences");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-end pt-2">
      <Button
        onClick={handleSave}
        disabled={disabled || isSaving || relays.length === 0}
        variant="default"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Check className="h-4 w-4 mr-2" />
        )}
        Save Relay Preferences
      </Button>
    </div>
  );
};
