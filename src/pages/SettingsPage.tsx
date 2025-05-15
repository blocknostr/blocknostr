
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, Settings } from "lucide-react";
import { useWallet } from "@alephium/web3-react";
import { cn } from "@/lib/utils";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { account } = useWallet();
  const [copyState, setCopyState] = useState<{[key: string]: boolean}>({});

  const pubkey = nostrService.publicKey;
  const npub = pubkey ? nostrService.getNpubFromHex(pubkey) : "";
  const hexPubkey = pubkey || "";

  useEffect(() => {
    if (!pubkey) {
      toast.error("You need to log in to access settings");
      navigate("/");
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate, pubkey]);

  const copyToClipboard = (id: string, value: string, label: string) => {
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
    <div className="flex-1">
      <PageHeader 
        title="Settings" 
        icon={<Settings className="h-5 w-5" />}
        description="Manage your account and preferences"
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <SettingsTabs />

        {/* Always show the card if logged in */}
        {isLoggedIn && (
          <Card className="border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="pt-6 space-y-5">
              <h3 className="text-lg font-medium mb-2">Your Keys & Identifiers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nostr npub</Label>
                  <Input 
                    readOnly 
                    value={npub} 
                    className="font-mono text-xs bg-muted/30 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Hex Pubkey</Label>
                  <Input 
                    readOnly 
                    value={hexPubkey} 
                    className="font-mono text-xs bg-muted/30 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Alephium Wallet</Label>
                  <Input
                    readOnly
                    value={account?.address || "Not connected"}
                    className="font-mono text-xs bg-muted/30 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end pt-2">
                {npub && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      "transition-all duration-200",
                      copyState["npub"] ? "bg-green-500/10 text-green-600 border-green-500/30" : ""
                    )}
                    onClick={() => copyToClipboard("npub", npub, "npub")}
                  >
                    {copyState["npub"] ? (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copyState["npub"] ? "Copied" : "Copy npub"}
                  </Button>
                )}
                {hexPubkey && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      "transition-all duration-200",
                      copyState["hex"] ? "bg-green-500/10 text-green-600 border-green-500/30" : ""
                    )}
                    onClick={() => copyToClipboard("hex", hexPubkey, "Hex pubkey")}
                  >
                    {copyState["hex"] ? (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copyState["hex"] ? "Copied" : "Copy Hex"}
                  </Button>
                )}
                {account?.address && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                      "transition-all duration-200",
                      copyState["wallet"] ? "bg-green-500/10 text-green-600 border-green-500/30" : ""
                    )}
                    onClick={() => copyToClipboard("wallet", account.address, "Wallet address")}
                  >
                    {copyState["wallet"] ? (
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                    ) : (
                      <Copy className="w-4 h-4 mr-1" />
                    )}
                    {copyState["wallet"] ? "Copied" : "Copy Wallet"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
