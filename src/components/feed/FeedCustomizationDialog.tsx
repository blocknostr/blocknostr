
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedType, useUserPreferences } from "@/hooks/useUserPreferences";
import { useMediaPreferences } from "@/hooks/useMediaPreferences";
import { X, Tag } from "lucide-react";

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
  const [newHashtag, setNewHashtag] = useState("");
  
  // Handler for adding a new hashtag
  const addHashtag = () => {
    if (!newHashtag.trim()) return;
    
    // Clean up hashtag: remove # prefix if exists, trim whitespace
    const cleanedTag = newHashtag.trim().replace(/^#/, '').toLowerCase();
    
    // Don't add empty or duplicate hashtags
    if (cleanedTag && !preferences.feedFilters.globalHashtags.includes(cleanedTag)) {
      const updatedHashtags = [...preferences.feedFilters.globalHashtags, cleanedTag];
      updateNestedPreference('feedFilters', 'globalHashtags', updatedHashtags);
    }
    
    // Clear the input
    setNewHashtag("");
  };
  
  // Handler for removing a hashtag
  const removeHashtag = (tagToRemove: string) => {
    const updatedHashtags = preferences.feedFilters.globalHashtags.filter(tag => tag !== tagToRemove);
    updateNestedPreference('feedFilters', 'globalHashtags', updatedHashtags);
  };
  
  // Handler for default feed change
  const handleDefaultFeedChange = (value: string) => {
    // Type guard to ensure value is a valid FeedType
    if (value === 'global' || value === 'following' || value === 'media') {
      updatePreference('defaultFeed', value as FeedType);
    }
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
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="defaultFeed">Default Feed</Label>
                <Select
                  value={preferences.defaultFeed}
                  onValueChange={handleDefaultFeedChange}
                >
                  <SelectTrigger id="defaultFeed" className="w-full">
                    <SelectValue placeholder="Choose default feed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="following">Following</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fontSize">Text Size</Label>
                <Select
                  value={preferences.uiPreferences.fontSize}
                  onValueChange={(value) => updateNestedPreference('uiPreferences', 'fontSize', value as any)}
                >
                  <SelectTrigger id="fontSize" className="w-full">
                    <SelectValue placeholder="Choose text size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compactMode">Compact Mode</Label>
                <Switch
                  id="compactMode"
                  checked={preferences.uiPreferences.compactMode}
                  onCheckedChange={(checked) => updateNestedPreference('uiPreferences', 'compactMode', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showTrending">Show Trending Section</Label>
                <Switch
                  id="showTrending"
                  checked={preferences.uiPreferences.showTrending}
                  onCheckedChange={(checked) => updateNestedPreference('uiPreferences', 'showTrending', checked)}
                />
              </div>
            </div>
          </TabsContent>
          
          {/* Hashtags Settings Tab */}
          <TabsContent value="hashtags" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="globalHashtags">Global Feed Hashtags</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  The global feed will only show posts with these hashtags
                </p>
                
                <div className="flex space-x-2 mb-2">
                  <Input 
                    id="newHashtag"
                    placeholder="Add hashtag..."
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={addHashtag}
                  >
                    Add
                  </Button>
                </div>
                
                {preferences.feedFilters.globalHashtags.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    No hashtags added. Global feed will show all posts.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {preferences.feedFilters.globalHashtags.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <X 
                          className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive" 
                          onClick={() => removeHashtag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Media Settings Tab */}
          <TabsContent value="media" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoPlayVideos">Auto-play videos (muted)</Label>
                <Switch
                  id="autoPlayVideos"
                  checked={mediaPrefs.autoPlayVideos}
                  onCheckedChange={(checked) => updateMediaPreference('autoPlayVideos', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="autoLoadImages">Auto-load images</Label>
                <Switch
                  id="autoLoadImages"
                  checked={mediaPrefs.autoLoadImages}
                  onCheckedChange={(checked) => updateMediaPreference('autoLoadImages', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="dataSaverMode">Data Saver Mode</Label>
                <Switch
                  id="dataSaverMode"
                  checked={mediaPrefs.dataSaverMode}
                  onCheckedChange={(checked) => updateMediaPreference('dataSaverMode', checked)}
                />
              </div>
              
              <div>
                <Label htmlFor="preferredQuality">Media Quality</Label>
                <Select
                  value={mediaPrefs.preferredQuality}
                  onValueChange={(value) => updateMediaPreference('preferredQuality', value as 'high' | 'medium' | 'low')}
                >
                  <SelectTrigger id="preferredQuality" className="w-full">
                    <SelectValue placeholder="Choose quality preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (Data Saver)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Higher quality uses more data and may load slower.
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Content Filters Tab */}
          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showReplies">Show Replies</Label>
                <Switch
                  id="showReplies"
                  checked={preferences.feedFilters.showReplies}
                  onCheckedChange={(checked) => updateNestedPreference('feedFilters', 'showReplies', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showReposted">Show Reposts</Label>
                <Switch
                  id="showReposted"
                  checked={preferences.feedFilters.showReposted}
                  onCheckedChange={(checked) => updateNestedPreference('feedFilters', 'showReposted', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="showSensitiveContent">Show Sensitive Content</Label>
                <Switch
                  id="showSensitiveContent"
                  checked={preferences.contentPreferences.showSensitiveContent}
                  onCheckedChange={(checked) => updateNestedPreference('contentPreferences', 'showSensitiveContent', checked)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4">
          <Button 
            variant="outline" 
            onClick={() => resetPreferences()}
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={() => onOpenChange(false)}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
