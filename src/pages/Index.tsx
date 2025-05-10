
import { useEffect, useState } from "react";
import MainFeed from "@/components/MainFeed";
import Sidebar from "@/components/Sidebar";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import { nostrService, EVENT_KINDS } from "@/lib/nostr";
import { useMediaQuery } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { hashtag } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [activeHashtag, setActiveHashtag] = useState<string | undefined>(hashtag);
  
  // Listen for changes from URL parameters
  useEffect(() => {
    setActiveHashtag(hashtag);
  }, [hashtag]);
  
  // Connect to relays when the component mounts
  useEffect(() => {
    const connectRelays = async () => {
      await nostrService.connectToRelays();
    };
    
    connectRelays();
  }, []);
  
  const handleClearHashtag = () => {
    setActiveHashtag(undefined);
    navigate("/");
  };
  
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-0 md:ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center h-14 px-4">
            <h1 className="font-semibold">Home</h1>
          </div>
        </header>
        
        <div className="flex">
          {/* Main content */}
          <div className="flex-1 px-4 py-4 border-r min-h-[calc(100vh-3.5rem)]">
            <MainFeed 
              activeHashtag={activeHashtag} 
              onClearHashtag={handleClearHashtag} 
            />
          </div>
          
          {/* Right sidebar - only shown on desktop */}
          {isDesktop && (
            <div className="w-80 px-4 py-4 hidden lg:block">
              <div className="space-y-6 sticky top-16">
                <TrendingSection />
                <WhoToFollow />
                
                {/* Links and info */}
                <div className="text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-x-2">
                    <a href="#" className="hover:underline">Terms of Service</a>
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <a href="#" className="hover:underline">Cookie Policy</a>
                    <a href="https://github.com/nostr-protocol/nostr" target="_blank" className="hover:underline">
                      About Nostr
                    </a>
                  </div>
                  <p className="mt-2">© 2023 BlockNostr</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
