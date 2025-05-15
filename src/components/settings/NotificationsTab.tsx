
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, Hourglass, MessageSquare, Heart, Repeat } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

const NotificationsTab = () => {
  const [preferences, setPreferences] = useState({
    mentions: true,
    replies: true,
    likes: false,
    reposts: false
  });
  
  const handleToggle = (setting: keyof typeof preferences) => {
    setPreferences(prev => {
      const newState = { ...prev, [setting]: !prev[setting] };
      
      // Since this is a demo, show toast for all settings changes
      toast.success("Preference updated", {
        description: `${setting} notifications ${newState[setting] ? "enabled" : "disabled"}`
      });
      
      return newState;
    });
  };
  
  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-xl font-semibold">Notification Settings</CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border rounded-lg divide-y">
          <div className="flex items-center justify-between p-3">
            <Label htmlFor="mentions" className="flex items-center gap-2 cursor-pointer">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span>Mentions</span>
            </Label>
            <Switch 
              id="mentions" 
              checked={preferences.mentions}
              onCheckedChange={() => handleToggle('mentions')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3">
            <Label htmlFor="replies" className="flex items-center gap-2 cursor-pointer">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span>Replies</span>
            </Label>
            <Switch 
              id="replies" 
              checked={preferences.replies}
              onCheckedChange={() => handleToggle('replies')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3">
            <Label htmlFor="likes" className="flex items-center gap-2 cursor-pointer">
              <Heart className="h-4 w-4 text-red-500" />
              <span>Likes</span>
            </Label>
            <Switch 
              id="likes" 
              checked={preferences.likes}
              onCheckedChange={() => handleToggle('likes')}
            />
          </div>
          
          <div className="flex items-center justify-between p-3">
            <Label htmlFor="reposts" className="flex items-center gap-2 cursor-pointer">
              <Repeat className="h-4 w-4 text-purple-500" />
              <span>Reposts</span>
            </Label>
            <Switch 
              id="reposts" 
              checked={preferences.reposts}
              onCheckedChange={() => handleToggle('reposts')}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3 rounded-md bg-muted/30 p-4 border border-border/50">
          <Hourglass className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Push Notifications Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              Push notifications will be implemented in a future update.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
