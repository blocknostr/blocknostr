
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, User, UserPlus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { Community } from "@/hooks/useCommunity";
import { Badge } from "../ui/badge";

interface DAOSettingsProps {
  community: Community;
  isCreator: boolean;
  isModerator: boolean;
  onSetPrivate: (isPrivate: boolean) => Promise<boolean>;
  onUpdateTags: (tags: string[]) => Promise<boolean>;
  onAddModerator: (pubkey: string) => Promise<boolean>;
  onRemoveModerator: (pubkey: string) => Promise<boolean>;
}

const DAOSettings = ({
  community,
  isCreator,
  isModerator,
  onSetPrivate,
  onUpdateTags,
  onAddModerator,
  onRemoveModerator
}: DAOSettingsProps) => {
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isPrivate, setIsPrivate] = useState(community.isPrivate || false);
  
  const [tags, setTags] = useState<string[]>(community.tags || []);
  const [newTag, setNewTag] = useState("");
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  
  const [newModeratorPubkey, setNewModeratorPubkey] = useState("");
  const [isAddingModerator, setIsAddingModerator] = useState(false);
  const [removingModerator, setRemovingModerator] = useState<string | null>(null);
  
  const handlePrivacyChange = async (checked: boolean) => {
    setIsUpdatingPrivacy(true);
    try {
      const success = await onSetPrivate(checked);
      if (success) {
        setIsPrivate(checked);
        toast.success(`DAO is now ${checked ? 'private' : 'public'}`);
      } else {
        toast.error("Failed to update privacy settings");
      }
    } catch (error) {
      toast.error("Error updating privacy settings");
      // Revert the UI state if the operation failed
      setIsPrivate(community.isPrivate || false);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };
  
  const addTag = () => {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };
  
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleUpdateTags = async () => {
    setIsUpdatingTags(true);
    try {
      const success = await onUpdateTags(tags);
      if (success) {
        toast.success("Tags updated successfully");
      } else {
        toast.error("Failed to update tags");
      }
    } catch (error) {
      toast.error("Error updating tags");
    } finally {
      setIsUpdatingTags(false);
    }
  };
  
  const handleAddModerator = async () => {
    if (!newModeratorPubkey.trim()) return;
    
    setIsAddingModerator(true);
    try {
      const success = await onAddModerator(newModeratorPubkey);
      if (success) {
        setNewModeratorPubkey("");
        toast.success("Moderator added successfully");
      } else {
        toast.error("Failed to add moderator");
      }
    } catch (error) {
      toast.error("Error adding moderator", {
        description: error instanceof Error ? error.message : undefined
      });
    } finally {
      setIsAddingModerator(false);
    }
  };
  
  const handleRemoveModerator = async (pubkey: string) => {
    setRemovingModerator(pubkey);
    try {
      const success = await onRemoveModerator(pubkey);
      if (success) {
        toast.success("Moderator removed successfully");
      } else {
        toast.error("Failed to remove moderator");
      }
    } catch (error) {
      toast.error("Error removing moderator");
    } finally {
      setRemovingModerator(null);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Privacy Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Private DAO</p>
            <p className="text-sm text-muted-foreground">
              Private DAOs require invitation to join.
            </p>
          </div>
          <Switch
            checked={isPrivate}
            onCheckedChange={handlePrivacyChange}
            disabled={isUpdatingPrivacy || !isCreator}
          />
        </div>
      </Card>
      
      {/* Tags Settings */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">DAO Tags</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="gap-1">
                {tag}
                <button 
                  className="ml-1 hover:text-destructive" 
                  onClick={() => removeTag(tag)}
                  disabled={!isCreator && !isModerator}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags added yet.</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag"
              disabled={!isCreator && !isModerator}
            />
            <Button 
              size="sm" 
              onClick={addTag}
              disabled={!newTag.trim() || (!isCreator && !isModerator)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleUpdateTags}
            disabled={isUpdatingTags || (!isCreator && !isModerator)}
          >
            {isUpdatingTags ? "Updating..." : "Update Tags"}
          </Button>
        </div>
      </Card>
      
      {/* Moderator Management */}
      {isCreator && (
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Moderator Management</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="moderators">Current Moderators</Label>
              {community.moderators && community.moderators.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {community.moderators.map((mod) => (
                    <div key={mod} className="flex justify-between items-center p-2 bg-muted rounded-md">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-mono">{mod.slice(0, 8)}...{mod.slice(-8)}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveModerator(mod)}
                        disabled={removingModerator === mod}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">No moderators yet.</p>
              )}
            </div>
            
            <Separator />
            
            <div>
              <Label htmlFor="newModerator">Add Moderator</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="newModerator"
                  value={newModeratorPubkey}
                  onChange={(e) => setNewModeratorPubkey(e.target.value)}
                  placeholder="Enter pubkey"
                />
                <Button 
                  onClick={handleAddModerator}
                  disabled={!newModeratorPubkey.trim() || isAddingModerator}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DAOSettings;
