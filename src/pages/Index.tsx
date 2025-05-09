
import MainFeed from "@/components/MainFeed";
import Sidebar from "@/components/Sidebar";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import LoginButton from "@/components/LoginButton";

const Index = () => {
  useEffect(() => {
    // Init connection to relays when the app loads
    const initNostr = async () => {
      await nostrService.connectToDefaultRelays();
    };
    
    initNostr();
  }, []);

  return (
    <div className="layout-container">
      <div className="sidebar-left hidden-mobile">
        <Sidebar />
      </div>
      
      <div className="main-content">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Home</h1>
            <LoginButton />
          </div>
        </header>
        
        <div className="content-area">
          <MainFeed />
        </div>
      </div>
      
      <div className="sidebar-right hidden-mobile">
        <div className="space-y-6">
          <TrendingSection />
          <WhoToFollow />
        </div>
      </div>
    </div>
  );
};

export default Index;
