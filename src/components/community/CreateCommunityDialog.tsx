
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface CreateCommunityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onCreateCommunity: (data: any) => Promise<void>;
}

const CreateCommunityDialog = ({ isOpen, setIsOpen, onCreateCommunity }: CreateCommunityDialogProps) => {
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);

  const handleCreateCommunity = async () => {
    if (!newCommunityName.trim()) {
      return;
    }
    
    setIsCreatingCommunity(true);
    
    try {
      await onCreateCommunity({
        name: newCommunityName.trim(),
        description: newCommunityDesc.trim(),
        id: `community-${Date.now()}` // Generate a unique ID
      });
      
      // Reset form
      setNewCommunityName("");
      setNewCommunityDesc("");
    } catch (error) {
      console.error("Error creating community:", error);
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new community</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Community Name"
              value={newCommunityName}
              onChange={(e) => setNewCommunityName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Description"
              value={newCommunityDesc}
              onChange={(e) => setNewCommunityDesc(e.target.value)}
              rows={4}
            />
          </div>
          <Button 
            onClick={handleCreateCommunity}
            disabled={isCreatingCommunity || !newCommunityName.trim()}
            className="w-full"
          >
            {isCreatingCommunity ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Create Community
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCommunityDialog;
