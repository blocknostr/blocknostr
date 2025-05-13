
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/ui/page-header";

const SettingsPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      const pubkey = nostrService.publicKey;
      setIsLoggedIn(!!pubkey);
      
      if (!pubkey) {
        toast.error("You need to log in to access settings");
        navigate("/");
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  return (
    <div className="flex-1">
      <PageHeader title="" />
      
      <div className="max-w-3xl mx-auto px-4 py-6">
        <SettingsTabs />
      </div>
    </div>
  );
};

export default SettingsPage;
