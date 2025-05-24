
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/sonner";
import { nostrService } from "@/lib/nostr";
import { Copy, CheckCircle2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@alephium/web3-react";

const AccountTab = () => {
  const [copyState, setCopyState] = useState<{[key: string]: boolean}>({});
  const { account } = useWallet();
  
  const pubkey = nostrService.publicKey;
  const npub = pubkey ? nostrService.getNpubFromHex(pubkey) : "";
  const hexPubkey = pubkey || "";
  
  const handleCopy = (id: string, value: string, label: string) => {
    navigator.clipboard.writeText(value);
    setCopyState({ ...copyState, [id]: true });
    
    toast.success(`${label} copied`, {
      description: `${label} has been copied to your clipboard`
    });
    
    setTimeout(() => {
      setCopyState({ ...copyState, [id]: false });
    }, 2000);
  };

  return (
    <Card className="border shadow-sm transition-all duration-200 hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-muted-foreground" />
          <div>
            <CardTitle className="text-xl font-semibold">Account Settings</CardTitle>
            <CardDescription className="text-muted-foreground">
              Manage your account settings and preferences
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="npub" className="font-medium">Nostr npub</Label>
            <div className="flex gap-2">
              <Input 
                id="npub"
                readOnly 
                value={npub}
                className="font-mono text-xs bg-muted/30 focus:ring-1 focus:ring-primary/20"
              />
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "transition-all duration-200",
                  copyState["npub"] ? "bg-green-500/10 text-green-600 border-green-500/30" : ""
                )}
                onClick={() => handleCopy("npub", npub, "npub")}
                title="Copy npub"
              >
                {copyState["npub"] ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="hexkey" className="font-medium">Hex Pubkey</Label>
            <div className="flex gap-2">
              <Input 
                id="hexkey"
                readOnly 
                value={hexPubkey}
                className="font-mono text-xs bg-muted/30 focus:ring-1 focus:ring-primary/20"
              />
              <Button
                variant="secondary"
                size="icon"
                className={cn(
                  "transition-all duration-200",
                  copyState["hex"] ? "bg-green-500/10 text-green-600 border-green-500/30" : ""
                )}
                onClick={() => handleCopy("hex", hexPubkey, "Hex pubkey")}
                title="Copy hex pubkey"
              >
                {copyState["hex"] ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          {account?.address && (
            <div className="space-y-2">
              <Label htmlFor="wallet" className="font-medium">Alephium Wallet</Label>
              <div className="flex gap-2">
                <Input
                  id="wallet"
                  readOnly
                  value={account.address}
                  className="font-mono text-xs bg-muted/30 focus:ring-1 focus:ring-primary/20"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "transition-all duration-200",
                    copyState["wallet"] ? "bg-green-500/10 text-green-600 border-green-500/30" : ""
                  )}
                  onClick={() => handleCopy("wallet", account.address, "Wallet address")}
                  title="Copy wallet address"
                >
                  {copyState["wallet"] ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
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
