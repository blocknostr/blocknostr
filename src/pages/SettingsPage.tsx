import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useWallet } from "@alephium/web3-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { account } = useWallet();

  const pubkey = nostrService.publicKey;
  const npub = pubkey ? nostrService.getNpub(pubkey) : "";
  const hexPubkey = pubkey || "";

  useEffect(() => {
    if (!pubkey) {
      toast.error("You need to log in to access settings");
      navigate("/");
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate, pubkey]);

  const copyToClipboard = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="flex-1">
      <PageHeader title="Settings" />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <SettingsTabs />

        {isLoggedIn && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <Label className="text-sm">Nostr npub</Label>
                  <Input readOnly value={npub} />
                </div>
                <div>
                  <Label className="text-sm">Hex Pubkey</Label>
                  <Input readOnly value={hexPubkey} />
                </div>
                <div>
                  <Label className="text-sm">Alephium Wallet</Label>
                  <Input
                    readOnly
                    value={account?.address || "Not connected"}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end pt-2">
                {npub && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(npub, "npub")}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy npub
                  </Button>
                )}
                {hexPubkey && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(hexPubkey, "Hex pubkey")}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Hex
                  </Button>
                )}
                {account?.address && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(account.address, "Wallet address")
                    }
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Wallet
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