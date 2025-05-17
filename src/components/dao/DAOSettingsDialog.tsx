import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Lock, Globe, Copy, Check } from "lucide-react";
import { DAO } from "@/types/dao";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";

interface DAOSettingsDialogProps {
  dao: DAO;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isCreator: boolean;
  onUpdatePrivacy: (daoId: string, isPrivate: boolean) => Promise<boolean>;
  onUpdateGuidelines: (daoId: string, guidelines: string) => Promise<boolean>;
  onUpdateTags: (daoId: string, tags: string[]) => Promise<boolean>;
  onAddModerator: (daoId: string, pubkey: string) => Promise<boolean>;
  onRemoveModerator: (daoId: string, pubkey: string) => Promise<boolean>;
  onCreateInviteLink: () => Promise<string | null>;
  embedded?: boolean; // New prop for embedded mode
  hideGuidelines?: boolean; // New prop to hide guidelines section
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
  onCreateInviteLink,
  embedded = false,
  hideGuidelines = false
}) => {
  const [isPrivate, setIsPrivate] = useState(dao.isPrivate || false);
  const [guidelines, setGuidelines] = useState(dao.guidelines || "");
  const [tags, setTags] = useState<string[]>(dao.tags || []);
  const [newTag, setNewTag] = useState("");
  const [moderatorPubkey, setModeratorPubkey] = useState("");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isUpdatingGuidelines, setIsUpdatingGuidelines] = useState(false);
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const [isAddingModerator, setIsAddingModerator] = useState(false);
  const [isRemovingModerator, setIsRemovingModerator] = useState(false);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  
  const handlePrivacyChange = async () => {
    setIsUpdatingPrivacy(true);
    try {
      const newPrivacyValue = !isPrivate;
      const success = await onUpdatePrivacy(dao.id, newPrivacyValue);
      if (success) {
        setIsPrivate(newPrivacyValue);
        toast.success(`DAO is now ${newPrivacyValue ? 'private' : 'public'}`);
      }
    } catch (error) {
      console.error("Error updating privacy:", error);
      toast.error("Failed to update privacy settings");
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };
  
  const handleGuidelinesUpdate = async () => {
    setIsUpdatingGuidelines(true);
    try {
      const success = await onUpdateGuidelines(dao.id, guidelines);
      if (success) {
        toast.success("Guidelines updated successfully");
      }
    } catch (error) {
      console.error("Error updating guidelines:", error);
      toast.error("Failed to update guidelines");
    } finally {
      setIsUpdatingGuidelines(false);
    }
  };
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    if (tags.includes(newTag.trim())) {
      toast.error("Tag already exists");
      return;
    }
    setTags([...tags, newTag.trim()]);
    setNewTag("");
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleUpdateTags = async () => {
    setIsUpdatingTags(true);
    try {
      const success = await onUpdateTags(dao.id, tags);
      if (success) {
        toast.success("Tags updated successfully");
      }
    } catch (error) {
      console.error("Error updating tags:", error);
      toast.error("Failed to update tags");
    } finally {
      setIsUpdatingTags(false);
    }
  };
  
  const handleAddModerator = async () => {
    if (!moderatorPubkey.trim()) return;
    
    setIsAddingModerator(true);
    try {
      const success = await onAddModerator(dao.id, moderatorPubkey);
      if (success) {
        setModeratorPubkey("");
        toast.success("Moderator added successfully");
      }
    } catch (error) {
      console.error("Error adding moderator:", error);
      toast.error("Failed to add moderator");
    } finally {
      setIsAddingModerator(false);
    }
  };
  
  const handleRemoveModerator = async (pubkey: string) => {
    setIsRemovingModerator(true);
    try {
      const success = await onRemoveModerator(dao.id, pubkey);
      if (success) {
        toast.success("Moderator removed successfully");
      }
    } catch (error) {
      console.error("Error removing moderator:", error);
      toast.error("Failed to remove moderator");
    } finally {
      setIsRemovingModerator(false);
    }
  };
  
  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const link = await onCreateInviteLink();
      if (link) {
        setInviteLink(link);
        toast.success("Invite link created successfully");
      }
    } catch (error) {
      console.error("Error creating invite link:", error);
      toast.error("Failed to create invite link");
    } finally {
      setIsCreatingInvite(false);
    }
  };
  
  const copyInviteLink = () => {
    if (!inviteLink) return;
    
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard");
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  
  // This is the main change - render either in dialog or directly based on embedded prop
  const renderContent = () => (
    <div className="space-y-6">
      {/* Privacy Settings (Creator Only) */}
      {isCreator && (
        <div>
          <h3 className="text-lg font-medium mb-2">Privacy Settings</h3>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center">
                {isPrivate ? (
                  <Lock className="h-4 w-4 mr-2 text-amber-500" />
                ) : (
                  <Globe className="h-4 w-4 mr-2 text-green-500" />
                )}
                <Label htmlFor="dao-privacy" className="font-medium">
                  {isPrivate ? "Private DAO" : "Public DAO"}
                </Label>
              </div>
              <p className="text-sm text-muted-foreground">
                {isPrivate 
                  ? "Only invited members can join this DAO" 
                  : "Anyone can join this DAO"}
              </p>
            </div>
            <Switch
              id="dao-privacy"
              checked={isPrivate}
              onCheckedChange={handlePrivacyChange}
              disabled={isUpdatingPrivacy}
            />
          </div>
        </div>
      )}
      
      {/* Guidelines - Only show if not hidden */}
      {!hideGuidelines && (
        <div>
          <h3 className="text-lg font-medium mb-2">DAO Guidelines</h3>
          <div className="space-y-2">
            <Textarea
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              placeholder="Enter guidelines for your DAO members..."
              className="min-h-[150px]"
            />
            <Button 
              onClick={handleGuidelinesUpdate}
              disabled={isUpdatingGuidelines}
            >
              {isUpdatingGuidelines ? "Updating..." : "Update Guidelines"}
            </Button>
          </div>
        </div>
      )}
      
      {/* Tags */}
      <div>
        <h3 className="text-lg font-medium mb-2">DAO Tags</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button 
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">No tags added yet</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a tag..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button 
              variant="outline" 
              onClick={handleAddTag}
              disabled={!newTag.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          
          <Button 
            onClick={handleUpdateTags}
            disabled={isUpdatingTags}
          >
            {isUpdatingTags ? "Updating..." : "Update Tags"}
          </Button>
        </div>
      </div>
      
      {/* Moderators (Creator Only) */}
      {isCreator && (
        <div>
          <h3 className="text-lg font-medium mb-2">Moderators</h3>
          <div className="space-y-4">
            {/* Current Moderators */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Current Moderators</h4>
              {dao.moderators && dao.moderators.length > 0 ? (
                <div className="space-y-2">
                  {dao.moderators.map(pubkey => (
                    <ModeratorItem 
                      key={pubkey} 
                      pubkey={pubkey} 
                      onRemove={() => handleRemoveModerator(pubkey)}
                      isRemoving={isRemovingModerator}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No moderators added yet</p>
              )}
            </div>
            
            {/* Add Moderator */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Add Moderator</h4>
              <div className="flex gap-2">
                <Input
                  value={moderatorPubkey}
                  onChange={(e) => setModeratorPubkey(e.target.value)}
                  placeholder="Enter Nostr pubkey..."
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddModerator}
                  disabled={!moderatorPubkey.trim() || isAddingModerator}
                >
                  {isAddingModerator ? "Adding..." : "Add"}
                </Button>
              </div>
            </div>
            
            {/* Invite Link */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Invite Link</h4>
              {inviteLink ? (
                <div className="flex gap-2">
                  <Input
                    value={inviteLink}
                    readOnly
                    className="flex-1 font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copyInviteLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline"
                  onClick={handleCreateInvite}
                  disabled={isCreatingInvite}
                >
                  {isCreatingInvite ? "Creating..." : "Create Invite Link"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  // If embedded, render the content directly
  if (embedded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>DAO Settings</CardTitle>
          <CardDescription>Customize this DAO's settings</CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  // Otherwise render as a dialog
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>DAO Settings</DialogTitle>
          <DialogDescription>Customize this DAO's settings</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};

// Helper component for displaying moderator info
const ModeratorItem = ({ 
  pubkey, 
  onRemove,
  isRemoving
}: { 
  pubkey: string; 
  onRemove: () => void;
  isRemoving: boolean;
}) => {
  const [profile, setProfile] = useState<any>(null);
  
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userProfile = await nostrService.getUserProfile(pubkey);
        setProfile(userProfile);
      } catch (error) {
        console.error("Error fetching moderator profile:", error);
      }
    };
    
    fetchProfile();
  }, [pubkey]);
  
  const displayName = profile?.name || profile?.displayName || pubkey.substring(0, 8);
  
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-muted/50">
      <div className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profile?.picture} alt={displayName} />
          <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">{pubkey.substring(0, 16)}...</p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onRemove}
        disabled={isRemoving}
      >
        <X className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
};

export default DAOSettingsDialog;
