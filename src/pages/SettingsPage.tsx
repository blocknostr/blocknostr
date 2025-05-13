
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  
  useEffect(() => {
    const checkAuth = () => {
      const pubkey = nostrService.publicKey;
      setIsLoggedIn(!!pubkey);

      if (!pubkey) {
        toast.error("You need to log in to access settings");
        navigate("/");
      }
      
      // In a real implementation, we would fetch the wallet address from Alephium
      // For now, we'll just mock it if the user is logged in with Nostr
      if (pubkey) {
        // This is a mock address - in a real implementation, this would come from Alephium
        setWalletAddress("1DrDyTr9RpRsQnDnXo2YRiPzPW4ooHX5LLoqXrqfMrpQH");
      }
    };
    
    checkAuth();
  }, [navigate]);

  const copyAndSelect = (e: React.MouseEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    el.select();
    navigator.clipboard.writeText(el.value);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="flex-1">
      <PageHeader title="Settings" />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Settings Tabs */}
        <SettingsTabs />

        {/* Connected Wallet Info */}
        {walletAddress && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-sm">Alephium Wallet Address</Label>
                <Input
                  readOnly
                  value={walletAddress}
                  onClick={copyAndSelect}
                  className="cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
