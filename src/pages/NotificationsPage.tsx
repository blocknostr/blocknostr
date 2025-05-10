
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import NotificationItem from "@/components/notification/NotificationItem";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [darkMode, setDarkMode] = useState(true);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Set initial dark mode state based on html class
  useEffect(() => {
    setDarkMode(document.documentElement.classList.contains('dark'));
  }, []);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!nostrService.publicKey) {
        setLoading(false);
        return;
      }
      
      await nostrService.connectToUserRelays();
      
      // Subscribe to mentions of the current user
      const subId = nostrService.subscribe(
        [
          {
            kinds: [1], // text notes
            "#p": [nostrService.publicKey], // with mentions of current user
            limit: 20,
          }
        ],
        (event) => {
          setNotifications(prev => {
            // Check if we already have this notification
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Add new notification and sort by creation time (newest first)
            return [...prev, event].sort((a, b) => b.created_at - a.created_at);
          });
          
          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        }
      );
      
      setLoading(false);
      
      return () => {
        nostrService.unsubscribe(subId);
      };
    };
    
    const fetchProfileData = (pubkey: string) => {
      const metadataSubId = nostrService.subscribe(
        [
          {
            kinds: [0],
            authors: [pubkey],
            limit: 1
          }
        ],
        (event) => {
          try {
            const metadata = JSON.parse(event.content);
            setProfiles(prev => ({
              ...prev,
              [pubkey]: metadata
            }));
          } catch (e) {
            console.error('Failed to parse profile metadata:', e);
          }
        }
      );
      
      // Cleanup subscription after a short time
      setTimeout(() => {
        nostrService.unsubscribe(metadataSubId);
      }, 5000);
    };
    
    fetchNotifications();
  }, []);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center justify-between h-14 px-4">
            <h1 className="font-semibold">Notifications</h1>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                <Lightbulb className={darkMode ? "h-5 w-5" : "h-5 w-5 text-yellow-500 fill-yellow-500"} />
              </Button>
            </div>
          </div>
        </header>
        
        <div className="flex">
          <main className="flex-1 border-r min-h-screen">
            <div className="max-w-2xl mx-auto px-4 py-4">
              {!nostrService.publicKey ? (
                <div className="p-6 text-center">
                  <p className="mb-4">You need to log in to see your notifications</p>
                  <Button onClick={() => nostrService.login()}>
                    Log in
                  </Button>
                </div>
              ) : loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No notifications found
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <NotificationItem 
                      key={notification.id}
                      notification={notification}
                      profileData={notification.pubkey ? profiles[notification.pubkey] : undefined}
                    />
                  ))}
                </div>
              )}
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

export default NotificationsPage;
