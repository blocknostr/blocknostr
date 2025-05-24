
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Lock, AlertTriangle, Shield } from "lucide-react";
import { useState } from "react";
import { toast } from "@/components/ui/sonner";

const PrivacyTab = () => {
  const [dmEncryption, setDmEncryption] = useState(true);
  
  const handleToggle = () => {
    setDmEncryption(!dmEncryption);
    toast.info(
      dmEncryption 
        ? "Using legacy encryption (NIP-04)" 
        : "Using recommended encryption (NIP-44)",
      { 
        description: "Your preference has been saved" 
      }
    );
  };
  
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
      <CardContent className="space-y-6">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">Public Protocol</p>
            <p className="text-sm text-muted-foreground">
              Note: Nostr is a public protocol. Messages sent in public channels
              are visible to anyone. Direct messages are encrypted but metadata
              (who is messaging whom) might be publicly visible.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Encryption Settings</h3>
          </div>
          
          <div className="flex items-center justify-between border rounded-md p-3">
            <Label htmlFor="dm-encryption" className="flex flex-col gap-1 cursor-pointer">
              <span>Use NIP-44 Encryption</span>
              <span className="text-xs text-muted-foreground">
                Enhanced security for direct messages (recommended)
              </span>
            </Label>
            <Switch 
              id="dm-encryption" 
              checked={dmEncryption}
              onCheckedChange={handleToggle}
            />
          </div>
        </div>
        
        <div className="rounded-md bg-blue-500/5 p-4 border border-blue-500/20">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="text-blue-500">
              <Lock className="h-4 w-4 inline-block" />
            </span>
            More privacy settings will be available in upcoming releases.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PrivacyTab;
