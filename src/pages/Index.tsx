
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
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Home</h1>
            <LoginButton />
          </div>
        </header>
        
        <div className="flex">
          <main className="flex-1 border-r min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-4">
              <MainFeed />
            </div>
          </main>
          
          <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
            <div className="space-y-6">
              <TrendingSection />
              <WhoToFollow />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Index;
