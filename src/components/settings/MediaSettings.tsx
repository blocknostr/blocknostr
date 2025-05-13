
import React from 'react';
import { useMediaPreferences } from '@/hooks/useMediaPreferences';
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Info } from "lucide-react";

export default function MediaSettings() {
  const { mediaPrefs, updateMediaPreference } = useMediaPreferences();
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Media Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure how media content appears in your feed
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="auto-play-videos">Auto-play Videos</Label>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-play-videos" className="text-sm font-normal">
                Play videos automatically while scrolling
              </Label>
              <p className="text-xs text-muted-foreground">
                Videos will play muted until clicked
              </p>
            </div>
            <Switch
              id="auto-play-videos"
              checked={mediaPrefs.autoPlayVideos}
              onCheckedChange={(checked) => 
                updateMediaPreference('autoPlayVideos', checked)
              }
              disabled={mediaPrefs.dataSaverMode}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="auto-load-images">Auto-load Images</Label>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-load-images" className="text-sm font-normal">
                Load images automatically while scrolling
              </Label>
              <p className="text-xs text-muted-foreground">
                Images will load as they come into view
              </p>
            </div>
            <Switch
              id="auto-load-images"
              checked={mediaPrefs.autoLoadImages}
              onCheckedChange={(checked) => 
                updateMediaPreference('autoLoadImages', checked)
              }
              disabled={mediaPrefs.dataSaverMode}
            />
          </div>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="data-saver">Data Saver Mode</Label>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="data-saver" className="text-sm font-normal">
                Reduce data usage for media content
              </Label>
              <p className="text-xs text-muted-foreground">
                Media will load in lower quality and only when requested
              </p>
            </div>
            <Switch
              id="data-saver"
              checked={mediaPrefs.dataSaverMode}
              onCheckedChange={(checked) => {
                updateMediaPreference('dataSaverMode', checked);
                // If enabling data saver mode, disable auto-play and auto-load
                if (checked) {
                  updateMediaPreference('autoPlayVideos', false);
                  updateMediaPreference('autoLoadImages', false);
                }
              }}
            />
          </div>
        </div>
        
        <div className="mt-2">
          <Label htmlFor="preferred-quality" className="mb-2 block">Media Quality</Label>
          <RadioGroup 
            id="preferred-quality"
            defaultValue={mediaPrefs.preferredQuality} 
            className="grid grid-cols-3 gap-4"
            onValueChange={(value) => 
              updateMediaPreference('preferredQuality', value as 'high' | 'medium' | 'low')
            }
            disabled={mediaPrefs.dataSaverMode}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="quality-low" />
              <Label htmlFor="quality-low">Low</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="quality-medium" />
              <Label htmlFor="quality-medium">Medium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="quality-high" />
              <Label htmlFor="quality-high">High</Label>
            </div>
          </RadioGroup>
          
          {mediaPrefs.dataSaverMode && (
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <Info className="h-3 w-3 mr-1" />
              <span>Quality is set to low in data saver mode</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
