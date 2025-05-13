
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Manage your privacy preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Note: Nostr is a public protocol. Messages sent in public channels
          are visible to anyone. Direct messages are encrypted but metadata
          (who is messaging whom) might be publicly visible.
        </p>
      </CardContent>
    </Card>
  );
};

export default PrivacyTab;
