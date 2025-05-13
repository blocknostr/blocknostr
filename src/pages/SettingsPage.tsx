
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";
import { useNavigate } from "react-router-dom";
import SettingsTabs from "@/components/settings/SettingsTabs";

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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            {/* Header area - intentionally empty */}
          </div>
        </header>
        
        <div className="max-w-3xl mx-auto px-4 py-4">
          <SettingsTabs />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
