
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
    repliesLoadingMore,
    repostsLoadingMore,
    reactionsLoadingMore,
    repliesHasMore,
    repostsHasMore,
    reactionsHasMore,
    loadingReactionProfiles,
    tabReposts,
    tabReferencedEvents,
    localOriginalPostProfiles,
    postsLoadMoreRef,
    mediaLoadMoreRef,
    repliesLoadMoreRef,
    repostsLoadMoreRef,
    likesLoadMoreRef,
    postsHasMore,
    mediaHasMore
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
            hasMore={postsHasMore}
            loadMoreRef={postsLoadMoreRef}
          />
        </TabsContent>
        
        {/* Replies Tab */}
        <TabsContent value="replies" className="mt-4">
          <RepliesTab 
            loading={repliesLoading}
            loadingMore={repliesLoadingMore}
            hasMore={repliesHasMore}
            displayedReplies={displayedReplies}
            profileData={profileData}
            loadMoreRef={repliesLoadMoreRef}
          />
        </TabsContent>

        {/* Reposts Tab */}
        <TabsContent value="reposts" className="mt-4">
          <RepostsTab 
            loading={repostsLoading}
            loadingMore={repostsLoadingMore}
            hasMore={repostsHasMore}
            reposts={tabReposts.length > 0 ? tabReposts : reposts}
            postsLimit={postsLimit}
            profileData={profileData}
            originalPostProfiles={localOriginalPostProfiles}
            loadMoreRef={repostsLoadMoreRef}
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
        
        {/* Likes Tab */}
        <TabsContent value="likes" className="mt-4">
          <LikesTab 
            loading={reactionsLoading}
            loadingMore={reactionsLoadingMore}
            hasMore={reactionsHasMore}
            loadingProfiles={loadingReactionProfiles}
            displayedReactions={displayedReactions}
            referencedEvents={tabReferencedEvents && Object.keys(tabReferencedEvents).length > 0 
              ? tabReferencedEvents 
              : referencedEvents || {}}
            profiles={profiles}
            loadMoreRef={likesLoadMoreRef}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
