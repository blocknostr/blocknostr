
'use client';

import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/use-notifications";
import NotificationTabs from "@/components/notification/NotificationTabs";
import LoginPrompt from "@/components/notification/LoginPrompt";
import { nostrService } from "@/lib/nostr";
import PageHeader from "@/components/navigation/PageHeader";

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<string>("mentions");
  const isMobile = useIsMobile();
  const { 
    notifications, 
    interactionNotifications, 
    loading, 
    interactionsLoading, 
    profiles, 
    userInteractions 
  } = useNotifications();

  return (
    <>
      <PageHeader 
        title="Notifications"
        showBackButton={true}
      />
      
      <main className="max-w-2xl mx-auto px-4 py-4">
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
      </main>
    </>
  );
}
