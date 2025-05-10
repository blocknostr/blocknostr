
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";

interface CreateCommunityDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CreateCommunityDialog = ({ isOpen, setIsOpen }: CreateCommunityDialogProps) => {
  const navigate = useNavigate();
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  
  const currentUserPubkey = nostrService.publicKey;

  const handleCreateCommunity = async () => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to create a community");
      return;
    }
    
    if (!newCommunityName.trim()) {
      toast.error("Community name is required");
      return;
    }
    
    setIsCreatingCommunity(true);
    
    try {
      const communityId = await nostrService.createCommunity({
        name: newCommunityName.trim(),
        description: newCommunityDesc.trim(),
        id: `community-${Date.now()}` // Generate a unique ID
      });
      
      if (communityId) {
        toast.success("Community created successfully!");
        setNewCommunityName("");
        setNewCommunityDesc("");
        setIsOpen(false);
        
        // Navigate to the new community
        setTimeout(() => {
          navigate(`/communities/${communityId}`);
        }, 1000);
      }
    } catch (error) {
      console.error("Error creating community:", error);
      toast.error("Failed to create community");
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Community
        </Button>
      </DialogTrigger>
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
