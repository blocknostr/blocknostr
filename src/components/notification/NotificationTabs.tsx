
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bell, MessageCircle } from "lucide-react";
import { NostrEvent } from "@/lib/nostr";
import NotificationItem from "@/components/notification/NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedNotification } from "@/types/notification";

interface NotificationTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  notifications: EnhancedNotification[];
  interactionNotifications: EnhancedNotification[];
  loading: boolean;
  interactionsLoading: boolean;
  profiles: Record<string, any>;
  userInteractions: string[];
  isMobile: boolean;
}

const NotificationTabs = ({
  activeTab,
  setActiveTab,
  notifications,
  interactionNotifications,
  loading,
  interactionsLoading,
  profiles,
  userInteractions,
  isMobile
}: NotificationTabsProps) => {
  return (
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
  );
};

export default NotificationTabs;
