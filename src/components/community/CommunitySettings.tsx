import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, X, Plus, Trash2, Wallet, ExternalLink } from "lucide-react";
import { Community } from "@/api/types/community";
import { nostrService } from "@/lib/nostr";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CommunitySettingsProps {
  community: Community;
  isCreator: boolean;
  isModerator: boolean;
  isCreatorOnlyMember: boolean;
  onSetPrivate: (isPrivate: boolean) => Promise<void>;
  onUpdateTags: (tags: string[]) => Promise<void>;
  onAddModerator: (pubkey: string) => Promise<void>;
  onRemoveModerator: (pubkey: string) => Promise<void>;
  onDeleteCommunity?: () => Promise<void>;
  onSetAlphaWallet?: (walletAddress: string) => Promise<void>;
}

const CommunitySettings = ({
  community,
  isCreator,
  isModerator,
  isCreatorOnlyMember,
  onSetPrivate,
  onUpdateTags,
  onAddModerator,
  onRemoveModerator,
  onDeleteCommunity,
  onSetAlphaWallet
}: CommunitySettingsProps) => {
  const [isPrivate, setIsPrivate] = useState(community.isPrivate || false);
  const [tags, setTags] = useState<string[]>(community.tags || []);
  const [newTag, setNewTag] = useState("");
  const [newModeratorPubkey, setNewModeratorPubkey] = useState("");
  const [alphaWallet, setAlphaWallet] = useState((community as any).alphaWallet || "");
  const [newAlphaWallet, setNewAlphaWallet] = useState("");
  const [isSubmitting, setIsSubmitting] = useState({
    privacy: false,
    tags: false,
    moderator: false,
    alphaWallet: false,
    delete: false
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

  const handleSetAlphaWallet = async () => {
    if (!newAlphaWallet.trim() || !onSetAlphaWallet) return;
    
    setIsSubmitting(prev => ({ ...prev, alphaWallet: true }));
    try {
      await onSetAlphaWallet(newAlphaWallet.trim());
      setAlphaWallet(newAlphaWallet.trim());
      setNewAlphaWallet("");
    } finally {
      setIsSubmitting(prev => ({ ...prev, alphaWallet: false }));
    }
  };

  const handleDeleteCommunity = async () => {
    if (!onDeleteCommunity) return;
    
    setIsSubmitting(prev => ({ ...prev, delete: true }));
    try {
      await onDeleteCommunity();
    } finally {
      setIsSubmitting(prev => ({ ...prev, delete: false }));
    }
  };
  
  const showModeratorSettings = isCreator;
  const canDelete = isCreator && isCreatorOnlyMember && !!onDeleteCommunity;
  
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

      {/* Alpha Wallet Settings - Only for Creator */}
      {isCreator && onSetAlphaWallet && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Community Alpha Wallet
            </CardTitle>
            <CardDescription>
              Set a wallet address for the community to track funds and transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alphaWallet ? (
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Current Alpha Wallet</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {alphaWallet.length > 20 ? `${alphaWallet.substring(0, 10)}...${alphaWallet.substring(alphaWallet.length - 10)}` : alphaWallet}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://explorer.alephium.org/addresses/${alphaWallet}`, '_blank')}
                          title="View wallet on Alephium Explorer"
                          aria-label="View wallet on Alephium Explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAlphaWallet("");
                        if (onSetAlphaWallet) onSetAlphaWallet("");
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alpha wallet set for this community</p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Enter wallet address (Alephium format)"
                  value={newAlphaWallet}
                  onChange={(e) => setNewAlphaWallet(e.target.value)}
                  className="flex-grow"
                />
                <Button
                  onClick={handleSetAlphaWallet}
                  disabled={isSubmitting.alphaWallet || !newAlphaWallet.trim()}
                >
                  {alphaWallet ? "Update" : "Set"} Wallet
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                The alpha wallet will be publicly visible to all community members for transparency.
                Members can track community funds and transactions using this address.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
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
                        title={`Remove ${tag} tag`}
                        aria-label={`Remove ${tag} tag`}
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

      {/* Danger Zone - Delete Community */}
      {canDelete && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <Trash2 className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this community. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-4">
                <h4 className="font-medium text-destructive mb-2">Delete Community</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  You can only delete this community because you are the creator and the only member. 
                  Once deleted, all proposals, discussions, and community data will be permanently lost.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      disabled={isSubmitting.delete}
                      className="w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Community
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the community "{community.name}".
                        All proposals, discussions, and community data will be lost forever.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteCommunity} 
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={isSubmitting.delete}
                      >
                        {isSubmitting.delete ? "Deleting..." : "Delete Community"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunitySettings;

