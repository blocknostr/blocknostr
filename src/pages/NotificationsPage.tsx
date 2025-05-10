
import { useEffect, useState } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import NotificationItem from "@/components/notification/NotificationItem";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import { Lightbulb, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";

interface EnhancedNotification extends NostrEvent {
  notificationType: "mention" | "reply" | "like" | "repost" | "interaction";
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [interactionNotifications, setInteractionNotifications] = useState<EnhancedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [interactionsLoading, setInteractionsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("mentions");
  const isMobile = useIsMobile();

  // Your interactions (posts you've liked, replied to, etc.)
  const [userInteractions, setUserInteractions] = useState<string[]>([]);
  
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
  
  // Fetch user's interactions (posts they've liked, replied to, etc.)
  useEffect(() => {
    const fetchUserInteractions = async () => {
      if (!nostrService.publicKey) {
        return;
      }
      
      await nostrService.connectToUserRelays();
      
      // Fetch user's interactions (replies, likes, reposts)
      const subId = nostrService.subscribe(
        [
          {
            kinds: [1, 7], // text notes and reactions
            authors: [nostrService.publicKey],
            limit: 50,
          }
        ],
        (event) => {
          // For replies and reactions, extract the original post IDs
          if (event.kind === 1) { // Text note (could be a reply)
            const replyToEvent = event.tags.find(tag => tag[0] === 'e');
            if (replyToEvent && replyToEvent[1]) {
              setUserInteractions(prev => {
                if (prev.includes(replyToEvent[1])) return prev;
                return [...prev, replyToEvent[1]];
              });
            }
          } else if (event.kind === 7) { // Reaction
            const reactedToEvent = event.tags.find(tag => tag[0] === 'e');
            if (reactedToEvent && reactedToEvent[1]) {
              setUserInteractions(prev => {
                if (prev.includes(reactedToEvent[1])) return prev;
                return [...prev, reactedToEvent[1]];
              });
            }
          }
        }
      );
      
      // Cleanup subscription after a reasonable time
      setTimeout(() => {
        nostrService.unsubscribe(subId);
      }, 8000);
    };
    
    fetchUserInteractions();
  }, []);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!nostrService.publicKey) {
        setLoading(false);
        setInteractionsLoading(false);
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
          const enhancedEvent = {
            ...event,
            notificationType: "mention" as const
          };
          
          setNotifications(prev => {
            // Check if we already have this notification
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Add new notification and sort by creation time (newest first)
            return [...prev, enhancedEvent].sort((a, b) => b.created_at - a.created_at);
          });
          
          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        }
      );

      // After a short delay, start checking for interactions on posts
      setTimeout(() => {
        setLoading(false);
        fetchInteractionNotifications();
      }, 1000);
      
      return () => {
        nostrService.unsubscribe(subId);
      };
    };
    
    const fetchInteractionNotifications = () => {
      if (userInteractions.length === 0) {
        setInteractionsLoading(false);
        return;
      }
      
      // Subscribe to events that reference posts the user has interacted with
      const interactionSubId = nostrService.subscribe(
        [
          {
            kinds: [1], // text notes
            "#e": userInteractions,
            limit: 20,
          }
        ],
        (event) => {
          // Skip events by the current user
          if (event.pubkey === nostrService.publicKey) {
            return;
          }
          
          const enhancedEvent = {
            ...event,
            notificationType: "interaction" as const
          };
          
          setInteractionNotifications(prev => {
            // Check if we already have this notification
            if (prev.some(e => e.id === event.id)) {
              return prev;
            }
            
            // Add new notification and sort by creation time (newest first)
            return [...prev, enhancedEvent].sort((a, b) => b.created_at - a.created_at);
          });
          
          // Fetch profile data for this pubkey if we don't have it yet
          if (event.pubkey && !profiles[event.pubkey]) {
            fetchProfileData(event.pubkey);
          }
        }
      );
      
      setInteractionsLoading(false);
      
      // Cleanup subscription after a reasonable time
      setTimeout(() => {
        nostrService.unsubscribe(interactionSubId);
      }, 8000);
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
  }, [userInteractions]);

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      
      <div className={`flex-1 ${isMobile ? "" : "ml-0 md:ml-64"}`}>
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
          <main className={`flex-1 ${isMobile ? "" : "border-r"} min-h-screen`}>
            <div className="max-w-2xl mx-auto px-4 py-4">
              {!nostrService.publicKey ? (
                <div className="p-6 text-center">
                  <p className="mb-4">You need to log in to see your notifications</p>
                  <Button onClick={() => nostrService.login()}>
                    Log in
                  </Button>
                </div>
              ) : (
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className={`mb-4 ${isMobile ? "w-full grid grid-cols-2" : ""}`}>
                    <TabsTrigger value="mentions" className="flex-1">
                      <span className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        <span>Mentions</span>
                      </span>
                    </TabsTrigger>
                    <TabsTrigger value="interactions" className="flex-1">
                      <span className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>Interactions</span>
                      </span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="mentions">
                    {loading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-28 w-full rounded-md" />
                        ))}
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No mention notifications found
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {notifications.map(notification => (
                          <NotificationItem 
                            key={notification.id}
                            notification={notification}
                            profileData={notification.pubkey ? profiles[notification.pubkey] : undefined}
                            type="mention"
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="interactions">
                    {interactionsLoading ? (
                      <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                          <Skeleton key={i} className="h-28 w-full rounded-md" />
                        ))}
                      </div>
                    ) : userInteractions.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        You haven't interacted with any posts yet
                      </div>
                    ) : interactionNotifications.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        No new activity on posts you've interacted with
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {interactionNotifications.map(notification => (
                          <NotificationItem 
                            key={notification.id}
                            notification={notification}
                            profileData={notification.pubkey ? profiles[notification.pubkey] : undefined}
                            type="interaction"
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </main>
          
          {!isMobile && (
            <aside className="w-80 p-4 hidden lg:block sticky top-14 h-[calc(100vh-3.5rem)]">
              <div className="space-y-6">
                <TrendingSection />
                <WhoToFollow />
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
