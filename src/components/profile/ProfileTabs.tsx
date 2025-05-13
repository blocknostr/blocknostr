
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NostrEvent } from "@/lib/nostr";
import { useProfileReplies } from "@/hooks/profile/useProfileReplies";
import { useProfileLikes } from "@/hooks/profile/useProfileLikes";
import { useProfileReposts } from "@/hooks/profile/useProfileReposts";
import { useProfileTabs } from "@/hooks/profile/useProfileTabs";

// Import our tab components
import PostsTab from "./tabs/PostsTab";
import RepliesTab from "./tabs/RepliesTab";
import RepostsTab from "./tabs/RepostsTab";
import MediaTab from "./tabs/MediaTab";
import LikesTab from "./tabs/LikesTab";

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
    displayedPosts,
    displayedMedia,
    displayedReplies,
    displayedReactions,
    tabOriginalPostProfiles,
    addProfileToOriginalPosts,
    profiles
  } = useProfileTabs({
    events,
    media,
    reposts,
    replies,
    reactions,
    hexPubkey
  });

  // Tab-specific data loading hooks
  const { 
    replies: tabReplies, 
    loading: repliesLoading 
  } = useProfileReplies({ 
    hexPubkey, 
    enabled: activeTab === "replies" 
  });
  
  const { 
    reactions: tabReactions, 
    referencedEvents: tabReferencedEvents, 
    loading: reactionsLoading 
  } = useProfileLikes({ 
    hexPubkey, 
    enabled: activeTab === "likes" 
  });
  
  const {
    reposts: tabReposts,
    loading: repostsLoading
  } = useProfileReposts({
    hexPubkey,
    enabled: activeTab === "reposts",
    originalPostProfiles: tabOriginalPostProfiles,
    onProfileFetched: addProfileToOriginalPosts
  });

  // Combine data from props and hooks
  const mergedReplies = tabReplies.length > 0 ? tabReplies : displayedReplies;
  const mergedReactions = tabReactions.length > 0 ? tabReactions : displayedReactions;
  const mergedReposts = tabReposts.length > 0 ? tabReposts : reposts.slice(0, 10);
  const mergedReferencedEvents = Object.keys(tabReferencedEvents).length > 0 
    ? tabReferencedEvents 
    : referencedEvents;

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
            posts={displayedPosts} 
            profileData={profileData}
          />
        </TabsContent>
        
        {/* Replies Tab */}
        <TabsContent value="replies" className="mt-4">
          <RepliesTab 
            replies={mergedReplies} 
            profileData={profileData}
            isLoading={repliesLoading}
          />
        </TabsContent>

        {/* Reposts Tab */}
        <TabsContent value="reposts" className="mt-4">
          <RepostsTab 
            reposts={mergedReposts} 
            profileData={profileData}
            originalPostProfiles={tabOriginalPostProfiles}
            isLoading={repostsLoading}
          />
        </TabsContent>
        
        {/* Media Tab */}
        <TabsContent value="media" className="mt-4">
          <MediaTab media={displayedMedia} />
        </TabsContent>
        
        {/* Likes Tab */}
        <TabsContent value="likes" className="mt-4">
          <LikesTab 
            reactions={mergedReactions}
            referencedEvents={mergedReferencedEvents}
            profiles={profiles}
            isLoading={reactionsLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileTabs;
