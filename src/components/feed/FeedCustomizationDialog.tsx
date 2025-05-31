import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedType, useUserPreferences } from "@/hooks/business/useUserPreferences";
import { useMediaPreferences } from "@/hooks/useMediaPreferences";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppDispatch } from "@/hooks/redux";
import { nostrApi } from "@/api/rtk/nostrApi";

interface FeedCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedCustomizationDialog({ 
  open, 
  onOpenChange 
}: FeedCustomizationDialogProps) {
  const { preferences, updatePreference, updateNestedPreference, resetPreferences } = useUserPreferences();
  const { mediaPrefs, updateMediaPreference } = useMediaPreferences();
  const [activeTab, setActiveTab] = useState("general");
  const [newTag, setNewTag] = useState("");
  const dispatch = useAppDispatch();
  
  const handleDefaultFeedChange = (value: string) => {
    // Type guard to ensure value is a valid FeedType
    if (value === 'global' || value === 'following' || value === 'media') {
      updatePreference('defaultFeed', value as FeedType);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim() && !preferences.feedFilters.globalFeedTags.includes(newTag.toLowerCase().trim())) {
      const updatedTags = [...preferences.feedFilters.globalFeedTags, newTag.toLowerCase().trim()];
      updateNestedPreference('feedFilters', 'globalFeedTags', updatedTags);
      setNewTag("");
      
      // Invalidate RTK Query cache to refresh feeds with new hashtags
      dispatch(nostrApi.util.invalidateTags(['Feed']));
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = preferences.feedFilters.globalFeedTags.filter(tag => tag !== tagToRemove);
    updateNestedPreference('feedFilters', 'globalFeedTags', updatedTags);
    
    // Invalidate RTK Query cache to refresh feeds with updated hashtags
    dispatch(nostrApi.util.invalidateTags(['Feed']));
  };
  
  const handleResetTags = () => {
    // Reset to default tags: bitcoin, nostr, alephium
    const defaultTags = ['bitcoin', 'nostr', 'alephium'];
    updateNestedPreference('feedFilters', 'globalFeedTags', defaultTags);
    
    // Invalidate RTK Query cache to refresh feeds with default hashtags
    dispatch(nostrApi.util.invalidateTags(['Feed']));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Feed Preferences</DialogTitle>
          <DialogDescription>
            Customize your feed experience and content display preferences.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <div>
              <Label htmlFor="defaultFeed" className="text-sm font-medium">
                Default Feed
              </Label>
              <Select value={preferences.defaultFeed} onValueChange={handleDefaultFeedChange}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Choose default feed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global Feed</SelectItem>
                  <SelectItem value="following">Following</SelectItem>
                  <SelectItem value="media">Media Feed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showReplies" className="text-sm font-medium">
                Show Replies
              </Label>
              <Switch
                id="showReplies"
                checked={preferences.feedFilters.showReplies}
                onCheckedChange={(checked) => 
                  updateNestedPreference('feedFilters', 'showReplies', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="showReposted" className="text-sm font-medium">
                Show Reposts
              </Label>
              <Switch
                id="showReposted"
                checked={preferences.feedFilters.showReposted}
                onCheckedChange={(checked) => 
                  updateNestedPreference('feedFilters', 'showReposted', checked)
                }
              />
            </div>
          </TabsContent>
          
          {/* Hashtags Tab */}
          <TabsContent value="hashtags" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Global Feed Hashtags
              </Label>
              <p className="text-xs text-muted-foreground mb-3">
                Posts with these hashtags will appear in your global feed
              </p>
              
              <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add hashtag..."
                  className="flex-1"
                />
                <Button type="submit" size="sm" disabled={!newTag.trim()}>
                  Add
                </Button>
              </form>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {preferences.feedFilters.globalFeedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    #{tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              
              {preferences.feedFilters.globalFeedTags.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetTags}
                  className="w-full"
                >
                  Reset to Default Tags
                </Button>
              )}
            </div>
          </TabsContent>
          
          {/* Media Tab */}
          <TabsContent value="media" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoPlayGifs" className="text-sm font-medium">
                Auto-play GIFs
              </Label>
              <Switch
                id="autoPlayGifs"
                checked={mediaPrefs.autoPlayGifs}
                onCheckedChange={(checked) => 
                  updateMediaPreference('autoPlayGifs', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="loadImages" className="text-sm font-medium">
                Load Images
              </Label>
              <Switch
                id="loadImages"
                checked={mediaPrefs.loadImages}
                onCheckedChange={(checked) => 
                  updateMediaPreference('loadImages', checked)
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="autoPlayVideos" className="text-sm font-medium">
                Auto-play Videos
              </Label>
              <Switch
                id="autoPlayVideos"
                checked={mediaPrefs.autoPlayVideos}
                onCheckedChange={(checked) => 
                  updateMediaPreference('autoPlayVideos', checked)
                }
              />
            </div>
          </TabsContent>
          
          {/* Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Content Filtering
              </Label>
              <p className="text-xs text-muted-foreground mb-4">
                Hide content based on keywords or user behavior
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="hideNsfw" className="text-sm">
                    Hide NSFW Content
                  </Label>
                  <Switch
                    id="hideNsfw"
                    checked={preferences.contentPreferences.hideNsfw}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('contentPreferences', 'hideNsfw', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="blurMedia" className="text-sm">
                    Blur Sensitive Media
                  </Label>
                  <Switch
                    id="blurMedia"
                    checked={preferences.contentPreferences.blurSensitiveMedia}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('contentPreferences', 'blurSensitiveMedia', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={resetPreferences}
            size="sm"
          >
            Reset All
          </Button>
          <DialogClose asChild>
            <Button size="sm">
              Save Changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

