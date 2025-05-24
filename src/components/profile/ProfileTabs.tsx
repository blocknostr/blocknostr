
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NostrEvent } from "@/lib/nostr";
import { useProfileTabsData } from "./hooks/useProfileTabsData";
import MediaTab from "./tabs/MediaTab";
import UnifiedFeedTab from "./tabs/UnifiedFeedTab";

interface ProfileTabsProps {
  events: NostrEvent[];
  media: NostrEvent[];
  reposts: { originalEvent: NostrEvent; repostEvent: NostrEvent }[];
  profileData: any;
  originalPostProfiles: Record<string, any>;
  replies?: NostrEvent[];
  reactions?: NostrEvent[];
  referencedEvents?: Record<string, any>;
  hexPubkey?: string;
}

const ProfileTabs = ({ 
  events = [], 
  media = [], 
  reposts = [], 
  profileData,
  originalPostProfiles = {},
  replies = [],
  reactions = [],
  referencedEvents = {},
  hexPubkey = ""
}: ProfileTabsProps) => {
  const {
    activeTab,
    handleTabChange,
    unifiedFeedItems,
    displayedMedia,
    unifiedFeedLoading,
    unifiedFeedLoadingMore,
    unifiedFeedHasMore,
    mediaHasMore,
    unifiedFeedLoadMoreRef,
    mediaLoadMoreRef
  } = useProfileTabsData({
    events,
    media,
    reposts,
    profileData,
    originalPostProfiles,
    replies,
    reactions,
    referencedEvents,
    hexPubkey
  });
  
  return (
    <div className="mt-6">
      <Tabs 
        defaultValue="feed" 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="feed">Feed</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>
        
        {/* Unified Feed Tab */}
        <TabsContent value="feed" className="mt-4">
          <UnifiedFeedTab 
            loading={unifiedFeedLoading}
            loadingMore={unifiedFeedLoadingMore}
            hasMore={unifiedFeedHasMore}
            feedItems={unifiedFeedItems}
            profileData={profileData}
            loadMoreRef={unifiedFeedLoadMoreRef}
          />
        </TabsContent>
        
        {/* Media Tab */}
        <TabsContent value="media" className="mt-4">
          <MediaTab 
            displayedMedia={displayedMedia} 
            hasMore={mediaHasMore}
            loadMoreRef={mediaLoadMoreRef}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
