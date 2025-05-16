
import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, 
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DAO } from "@/types/dao";
import { Lock, Tag, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DAOSettingsDialogProps {
  dao: DAO;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCreator: boolean;
  onUpdatePrivacy: (isPrivate: boolean) => Promise<boolean>;
  onUpdateGuidelines: (guidelines: string) => Promise<boolean>;
  onUpdateTags: (tags: string[]) => Promise<boolean>;
  onAddModerator: (pubkey: string) => Promise<boolean>;
  onRemoveModerator: (pubkey: string) => Promise<boolean>;
  onCreateInviteLink: () => Promise<string | null>;
}

const DAOSettingsDialog: React.FC<DAOSettingsDialogProps> = ({
  dao,
  isOpen,
  onOpenChange,
  isCreator,
  onUpdatePrivacy,
  onUpdateGuidelines,
  onUpdateTags,
  onAddModerator,
  onRemoveModerator,
  onCreateInviteLink
}) => {
  const [guidelines, setGuidelines] = useState(dao.guidelines || "");
  const [isPrivate, setIsPrivate] = useState(dao.isPrivate || false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(dao.tags || []);
  const [moderatorInput, setModeratorInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  
  // Handle tag input
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  // Handle submitting changes
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Update privacy setting if changed
      if (isPrivate !== dao.isPrivate) {
        const privacySuccess = await onUpdatePrivacy(isPrivate);
        if (privacySuccess) {
          toast.success("Privacy settings updated");
        }
      }
      
      // Update guidelines if changed
      if (guidelines !== dao.guidelines) {
        const guidelinesSuccess = await onUpdateGuidelines(guidelines);
        if (guidelinesSuccess) {
          toast.success("Guidelines updated");
        }
      }
      
      // Update tags if changed
      if (JSON.stringify(tags) !== JSON.stringify(dao.tags)) {
        const tagsSuccess = await onUpdateTags(tags);
        if (tagsSuccess) {
          toast.success("Tags updated");
        }
      }
      
      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating DAO settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle moderator actions
  const handleAddModerator = async () => {
    if (!moderatorInput.trim()) return;
    
    try {
      const success = await onAddModerator(moderatorInput.trim());
      if (success) {
        toast.success("Moderator added");
        setModeratorInput("");
      } else {
        toast.error("Failed to add moderator");
      }
    } catch (error) {
      console.error("Error adding moderator:", error);
      toast.error("Failed to add moderator");
    }
  };
  
  const handleRemoveModerator = async (pubkey: string) => {
    try {
      const success = await onRemoveModerator(pubkey);
      if (success) {
        toast.success("Moderator removed");
      } else {
        toast.error("Failed to remove moderator");
      }
    } catch (error) {
      console.error("Error removing moderator:", error);
      toast.error("Failed to remove moderator");
    }
  };
  
  // Create invite link
  const handleCreateInviteLink = async () => {
    try {
      const link = await onCreateInviteLink();
      if (link) {
        setInviteLink(link);
        toast.success("Invite link created");
      } else {
        toast.error("Failed to create invite link");
      }
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error("Failed to create invite link");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>DAO Settings</DialogTitle>
          <DialogDescription>
            Configure settings for {dao.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          {/* Privacy Settings */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="private-mode" className="flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                  Private DAO
                </Label>
                <p className="text-xs text-muted-foreground">
                  Private DAOs require invitation to join
                </p>
              </div>
              <Switch
                id="private-mode"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                disabled={!isCreator}
              />
            </div>
          </div>

          {/* DAO Tags */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
              DAO Tags
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Add tags to help others discover your DAO
            </p>
            
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  {isCreator && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            
            {isCreator && (
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Enter tag..."
                  className="flex-1"
                  maxLength={20}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Moderators */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
              Moderators
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Moderators can manage proposals and members
            </p>
            
            <div className="space-y-2 mb-2">
              {dao.moderators.length === 0 ? (
                <p className="text-sm text-muted-foreground">No moderators assigned</p>
              ) : (
                dao.moderators.map((pubkey) => (
                  <div key={pubkey} className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                    <span className="text-sm truncate max-w-[300px]">
                      {pubkey}
                    </span>
                    {isCreator && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveModerator(pubkey)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {isCreator && (
              <div className="flex gap-2">
                <Input
                  value={moderatorInput}
                  onChange={(e) => setModeratorInput(e.target.value)}
                  placeholder="Enter pubkey..."
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleAddModerator}
                  disabled={!moderatorInput.trim()}
                >
                  Add
                </Button>
              </div>
            )}
          </div>
          
          {/* Invite Link */}
          {isPrivate && (
            <div className="space-y-2">
              <Label className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                Invite Link
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Create a link to invite new members
              </p>
              
              {inviteLink ? (
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteLink);
                      toast.success("Invite link copied to clipboard");
                    }}
                  >
                    Copy
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateInviteLink}
                >
                  Create Invite Link
                </Button>
              )}
            </div>
          )}

          {/* Guidelines */}
          <div className="space-y-2">
            <Label htmlFor="guidelines" className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-muted-foreground" />
              Guidelines
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Set rules and expectations for members
            </p>
            <Textarea
              id="guidelines"
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Enter community guidelines..."
              rows={5}
              disabled={!isCreator}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {isCreator && (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DAOSettingsDialog;
