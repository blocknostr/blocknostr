
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, X, Plus } from "lucide-react";
import { Community } from "@/types/community";
import { nostrService } from "@/lib/nostr";

interface CommunitySettingsProps {
  community: Community;
  isCreator: boolean;
  isModerator: boolean;
  onSetPrivate: (isPrivate: boolean) => Promise<void>;
  onUpdateTags: (tags: string[]) => Promise<void>;
  onAddModerator: (pubkey: string) => Promise<void>;
  onRemoveModerator: (pubkey: string) => Promise<void>;
}

const CommunitySettings = ({
  community,
  isCreator,
  isModerator,
  onSetPrivate,
  onUpdateTags,
  onAddModerator,
  onRemoveModerator
}: CommunitySettingsProps) => {
  const [isPrivate, setIsPrivate] = useState(community.isPrivate || false);
  const [tags, setTags] = useState<string[]>(community.tags || []);
  const [newTag, setNewTag] = useState("");
  const [newModeratorPubkey, setNewModeratorPubkey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState({
    privacy: false,
    tags: false,
    moderator: false
  });
  
  const handlePrivacyToggle = async () => {
    setIsSubmitting(prev => ({ ...prev, privacy: true }));
    try {
      await onSetPrivate(!isPrivate);
      setIsPrivate(!isPrivate);
    } finally {
      setIsSubmitting(prev => ({ ...prev, privacy: false }));
    }
  };
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const trimmedTag = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (tags.includes(trimmedTag)) return;
    
    setTags([...tags, trimmedTag]);
    setNewTag("");
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const handleUpdateTags = async () => {
    setIsSubmitting(prev => ({ ...prev, tags: true }));
    try {
      await onUpdateTags(tags);
    } finally {
      setIsSubmitting(prev => ({ ...prev, tags: false }));
    }
  };
  
  const handleAddModerator = async () => {
    if (!newModeratorPubkey.trim()) return;
    
    setIsSubmitting(prev => ({ ...prev, moderator: true }));
    try {
      await onAddModerator(newModeratorPubkey);
      setNewModeratorPubkey("");
    } finally {
      setIsSubmitting(prev => ({ ...prev, moderator: false }));
    }
  };
  
  const handleRemoveModerator = async (pubkey: string) => {
    setIsSubmitting(prev => ({ ...prev, moderator: true }));
    try {
      await onRemoveModerator(pubkey);
    } finally {
      setIsSubmitting(prev => ({ ...prev, moderator: false }));
    }
  };
  
  const showModeratorSettings = isCreator;
  
  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lock className="h-5 w-5 mr-2" />
            Community Privacy
          </CardTitle>
          <CardDescription>
            Control who can see and join your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="private-mode" className="font-medium">
                Private Community
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, only people with invite links can join
              </p>
            </div>
            <Switch
              id="private-mode"
              checked={isPrivate}
              onCheckedChange={handlePrivacyToggle}
              disabled={isSubmitting.privacy || !isCreator}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Tags Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Community Tags</CardTitle>
          <CardDescription>
            Add tags to help others discover your community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tags added yet</p>
              ) : (
                tags.map(tag => (
                  <Badge key={tag} variant="outline" className="flex items-center gap-1">
                    {tag}
                    {(isCreator || isModerator) && (
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 h-4 w-4 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))
              )}
            </div>
            
            {(isCreator || isModerator) && (
              <div className="flex gap-2">
                <Input
                  placeholder="Add a new tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-grow"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {(isCreator || isModerator) && tags.length > 0 && (
              <Button
                onClick={handleUpdateTags}
                disabled={isSubmitting.tags}
              >
                {isSubmitting.tags ? "Saving..." : "Save Tags"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Moderator Settings - Only for Creator */}
      {showModeratorSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Community Moderators
            </CardTitle>
            <CardDescription>
              Add trusted members as moderators to help manage the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                {(!community.moderators || community.moderators.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-2">No moderators assigned yet</p>
                ) : (
                  <ul className="space-y-2">
                    {community.moderators.map(pubkey => (
                      <li key={pubkey} className="flex items-center justify-between py-2 border-b last:border-b-0">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2 text-primary" />
                          <span className="font-medium">
                            {nostrService.getNpubFromHex(pubkey).substring(0, 10)}...
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveModerator(pubkey)}
                          disabled={isSubmitting.moderator}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter npub or hex key of new moderator"
                  value={newModeratorPubkey}
                  onChange={(e) => setNewModeratorPubkey(e.target.value)}
                  className="flex-grow"
                />
                <Button
                  onClick={handleAddModerator}
                  disabled={isSubmitting.moderator || !newModeratorPubkey.trim()}
                >
                  Add Moderator
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunitySettings;
