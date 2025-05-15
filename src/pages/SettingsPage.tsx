
import { useState, useEffect } from "react";
import { toast } from "@/components/ui/sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/ui/page-header";
import { Settings } from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const pubkey = nostrService.publicKey;

  useEffect(() => {
    if (!pubkey) {
      toast.error("You need to log in to access settings");
      navigate("/");
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate, pubkey]);

  return (
    <div className="flex-1 min-h-screen">
      <PageHeader 
        title="Settings" 
        icon={<Settings className="h-5 w-5" />}
        description="Manage your account and preferences"
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {isLoggedIn && (
          <div className="animate-fade-in">
            <SettingsTabs />
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
