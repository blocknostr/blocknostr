
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";

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
    <div className="px-4 py-6 max-w-7xl mx-auto">
      {isLoggedIn && (
        <div className="animate-fade-in">
          <SettingsTabs />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

