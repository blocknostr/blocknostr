
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NostrEvent } from "@/lib/nostr";
import { useProfileTabsData } from "./hooks/useProfileTabsData";
import { PostsTab } from "./tabs/PostsTab";
import { RepliesTab } from "./tabs/RepliesTab";
import { RepostsTab } from "./tabs/RepostsTab";
import { MediaTab } from "./tabs/MediaTab";
import { LikesTab } from "./tabs/LikesTab";

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
    postsLimit,
    profiles,
    displayedPosts,
    displayedMedia,
    displayedReplies,
    displayedReactions,
    repliesLoading,
    repostsLoading,
    reactionsLoading,
    loadingReactionProfiles,
    tabReposts,
    tabReferencedEvents,
    localOriginalPostProfiles
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
        defaultValue="posts" 
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="replies">Replies</TabsTrigger>
          <TabsTrigger value="reposts">Reposts</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="likes">Likes</TabsTrigger>
        </TabsList>
        
        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <PostsTab 
            displayedPosts={displayedPosts} 
            profileData={profileData} 
          />
        </TabsContent>
        
        {/* Replies Tab */}
        <TabsContent value="replies" className="mt-4">
          <RepliesTab 
            loading={repliesLoading}
            displayedReplies={displayedReplies}
            profileData={profileData}
          />
        </TabsContent>

        {/* Reposts Tab */}
        <TabsContent value="reposts" className="mt-4">
          <RepostsTab 
            loading={repostsLoading}
            reposts={tabReposts.length > 0 ? tabReposts : reposts}
            postsLimit={postsLimit}
            profileData={profileData}
            originalPostProfiles={localOriginalPostProfiles}
          />
        </TabsContent>
        
        {/* Media Tab */}
        <TabsContent value="media" className="mt-4">
          <MediaTab displayedMedia={displayedMedia} />
        </TabsContent>
        
        {/* Likes Tab */}
        <TabsContent value="likes" className="mt-4">
          <LikesTab 
            loading={reactionsLoading}
            loadingProfiles={loadingReactionProfiles}
            displayedReactions={displayedReactions}
            referencedEvents={tabReferencedEvents && Object.keys(tabReferencedEvents).length > 0 
              ? tabReferencedEvents 
              : referencedEvents || {}}
            profiles={profiles}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
