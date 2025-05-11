
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FeedType, UserPreferences, useUserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";

interface FeedCustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedCustomizationDialog({ open, onOpenChange }: FeedCustomizationDialogProps) {
  const { preferences, updatePreference, updateNestedPreference, resetPreferences } = useUserPreferences();
  const [activeTab, setActiveTab] = useState("general");

  const handleSave = () => {
    onOpenChange(false);
    toast.success("Preferences saved successfully");
  };

  const handleReset = () => {
    resetPreferences();
    toast.info("Preferences reset to default");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Feed Customization</DialogTitle>
          <DialogDescription>
            Customize your feed experience on BlockNoster
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Default Feed</h3>
                <RadioGroup 
                  value={preferences.defaultFeed}
                  onValueChange={(value) => updatePreference('defaultFeed', value as FeedType)}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="global" id="global" />
                    <Label htmlFor="global">Global</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="following" id="following" />
                    <Label htmlFor="following">Following</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="for-you" id="for-you" />
                    <Label htmlFor="for-you">For You</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="media" id="media" />
                    <Label htmlFor="media">Media</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Feed Filters</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-replies" className="cursor-pointer">Show replies in feeds</Label>
                  <Switch 
                    id="show-replies" 
                    checked={preferences.feedFilters.showReplies}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('feedFilters', 'showReplies', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-reposted" className="cursor-pointer">Show reposted content</Label>
                  <Switch 
                    id="show-reposted" 
                    checked={preferences.feedFilters.showReposted}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('feedFilters', 'showReposted', checked)
                    }
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-mentions" className="cursor-pointer">Notify on mentions</Label>
                  <Switch 
                    id="notify-mentions" 
                    checked={preferences.notificationPreferences.notifyOnMentions}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('notificationPreferences', 'notifyOnMentions', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-replies" className="cursor-pointer">Notify on replies</Label>
                  <Switch 
                    id="notify-replies" 
                    checked={preferences.notificationPreferences.notifyOnReplies}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('notificationPreferences', 'notifyOnReplies', checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify-reactions" className="cursor-pointer">Notify on reactions (likes)</Label>
                  <Switch 
                    id="notify-reactions" 
                    checked={preferences.notificationPreferences.notifyOnReactions}
                    onCheckedChange={(checked) => 
                      updateNestedPreference('notificationPreferences', 'notifyOnReactions', checked)
                    }
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Content Settings</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sensitive-content" className="cursor-pointer">Show sensitive content</Label>
                <Switch 
                  id="sensitive-content" 
                  checked={preferences.contentPreferences.showSensitiveContent}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('contentPreferences', 'showSensitiveContent', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="media-default" className="cursor-pointer">Show media by default</Label>
                <Switch 
                  id="media-default" 
                  checked={preferences.contentPreferences.showMediaByDefault}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('contentPreferences', 'showMediaByDefault', checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="preview-images" className="cursor-pointer">Show preview images</Label>
                <Switch 
                  id="preview-images" 
                  checked={preferences.contentPreferences.showPreviewImages}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('contentPreferences', 'showPreviewImages', checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium">Relay Settings</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-connect" className="cursor-pointer">
                  Auto-connect to relays on startup
                </Label>
                <Switch 
                  id="auto-connect" 
                  checked={preferences.relayPreferences.autoConnect}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('relayPreferences', 'autoConnect', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4 py-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium">UI Preferences</h3>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="compact-mode" className="cursor-pointer">Compact mode</Label>
                <Switch 
                  id="compact-mode" 
                  checked={preferences.uiPreferences.compactMode}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('uiPreferences', 'compactMode', checked)
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm">Font Size</Label>
                <RadioGroup 
                  value={preferences.uiPreferences.fontSize}
                  onValueChange={(value) => 
                    updateNestedPreference('uiPreferences', 'fontSize', 
                      value as 'small' | 'medium' | 'large'
                    )
                  }
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small" className="text-sm">Small</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="text-base">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large" className="text-lg">Large</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-trending" className="cursor-pointer">Show trending section</Label>
                <Switch 
                  id="show-trending" 
                  checked={preferences.uiPreferences.showTrending}
                  onCheckedChange={(checked) => 
                    updateNestedPreference('uiPreferences', 'showTrending', checked)
                  }
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
