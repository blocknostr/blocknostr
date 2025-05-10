
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/hooks/use-theme";
import { useNotifications } from "@/hooks/use-notifications";
import Sidebar from "@/components/Sidebar";
import TrendingSection from "@/components/TrendingSection";
import WhoToFollow from "@/components/WhoToFollow";
import NotificationsHeader from "@/components/notification/NotificationsHeader";
import NotificationTabs from "@/components/notification/NotificationTabs";
import LoginPrompt from "@/components/notification/LoginPrompt";
import { nostrService } from "@/lib/nostr";

const NotificationsPage = () => {
  const [activeTab, setActiveTab] = useState<string>("mentions");
  const isMobile = useIsMobile();
  const { darkMode, toggleDarkMode } = useTheme();
  const { 
    notifications, 
    interactionNotifications, 
    loading, 
    interactionsLoading, 
    profiles, 
    userInteractions 
  } = useNotifications();

  return (
    <div className="flex min-h-screen bg-background">
      {!isMobile && <Sidebar />}
      
      <div className={`flex-1 ${isMobile ? "" : "ml-0 md:ml-64"}`}>
        <NotificationsHeader 
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />
        
        <div className="flex">
          <main className={`flex-1 ${isMobile ? "" : "border-r"} min-h-screen`}>
            <div className="max-w-2xl mx-auto px-4 py-4">
              {!nostrService.publicKey ? (
                <LoginPrompt />
              ) : (
                <NotificationTabs
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  notifications={notifications}
                  interactionNotifications={interactionNotifications}
                  loading={loading}
                  interactionsLoading={interactionsLoading}
                  profiles={profiles}
                  userInteractions={userInteractions}
                  isMobile={isMobile}
                />
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
