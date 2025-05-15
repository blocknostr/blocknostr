
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { nostrService } from "@/lib/nostr";
import { Copy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const AccountTab = () => {
  const [copyState, setCopyState] = useState<{[key: string]: boolean}>({});
  
  const handleCopy = (id: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopyState({ ...copyState, [id]: true });
    
    toast.success("Copied to clipboard", {
      description: "The value has been copied to your clipboard"
    });
    
    setTimeout(() => {
      setCopyState({ ...copyState, [id]: false });
    }, 2000);
  };

  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Account Settings</CardTitle>
        <CardDescription className="text-muted-foreground">
          Manage your account settings and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="pubkey" className="font-medium">Your Public Key (NPUB)</Label>
          <div className="flex items-center mt-1.5 gap-2">
            <Input 
              id="pubkey" 
              readOnly 
              value={nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : ''}
              className={cn(
                "font-mono bg-muted/30 text-sm",
                "focus:ring-1 focus:ring-primary/20"
              )}
            />
            <Button 
              size="sm" 
              variant="outline"
              className={cn(
                "transition-all duration-200 relative",
                copyState["pubkey"] ? "bg-green-500/10 text-green-600 border-green-500/30" : "hover:bg-primary/10"
              )}
              onClick={() => handleCopy(
                "pubkey",
                nostrService.publicKey ? nostrService.formatPubkey(nostrService.publicKey) : ''
              )}
            >
              {copyState["pubkey"] ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <Copy className="h-4 w-4 mr-2" />
              )}
              {copyState["pubkey"] ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        
        <div className="space-y-2 pt-2">
          <Label className="font-medium">Profile Information</Label>
          <div className="rounded-md bg-muted/30 p-4 border border-border/50">
            <p className="text-sm text-muted-foreground">
              To update your profile information, post a kind 0 event with your metadata.
              This includes your display name, profile picture, and other details.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountTab;
