
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Clock, Hourglass } from "lucide-react";

const NotificationsTab = () => {
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
        <div className="flex items-center gap-3 rounded-md bg-muted/30 p-4 border border-border/50">
          <Hourglass className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              Notification features will be implemented in a future update.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 rounded-md bg-blue-500/10 p-4 border border-blue-500/20">
          <Clock className="h-5 w-5 text-blue-500" />
          <p className="text-sm">
            Stay tuned for advanced notification controls for mentions, likes, reposts, and more.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationsTab;
