
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertTriangle } from "lucide-react";

const PrivacyTab = () => {
  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-xl font-semibold">Privacy Settings</CardTitle>
            <CardDescription>
              Manage your privacy preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium mb-1">Public Protocol</p>
            <p className="text-sm text-muted-foreground">
              Note: Nostr is a public protocol. Messages sent in public channels
              are visible to anyone. Direct messages are encrypted but metadata
              (who is messaging whom) might be publicly visible.
            </p>
          </div>
        </div>
        
        <div className="rounded-md bg-muted/30 p-4 border border-border/50">
          <p className="text-sm text-muted-foreground">
            More privacy settings will be available in upcoming releases.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacyTab;
