
'use client';

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { nostrService } from "@/lib/nostr";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileLoading from "@/components/profile/ProfileLoading";
import ProfileNotFound from "@/components/profile/ProfileNotFound";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useProfileData } from "@/hooks/useProfileData";
import PageHeader from "@/components/navigation/PageHeader";

export default function ProfileDetailPage() {
  const params = useParams();
  const npub = params.pubkey as string;
  const router = useRouter();
  const currentUserPubkey = nostrService.publicKey;
  
  // Use our custom hook to manage profile data and state
  const {
    profileData,
    events,
    replies,
    media,
    reposts,
    loading,
    relays,
    setRelays,
    followers,
    following,
    originalPostProfiles,
    isCurrentUser
  } = useProfileData({ npub, currentUserPubkey });
  
  if (loading) {
    return (
      <>
        <PageHeader 
          title="Profile"
          showBackButton={true}
        />
        <ProfileLoading />
      </>
    );
  }
  
  return (
    <>
      <PageHeader 
        title={profileData?.display_name || profileData?.name || "Profile"}
        showBackButton={true}
      />
      
      <div className="max-w-3xl mx-auto px-4 py-4">
        {profileData ? (
          <>
            <ProfileHeader 
              profileData={profileData}
              npub={npub}
              isCurrentUser={isCurrentUser}
            />
            
            <ProfileStats 
              followers={followers}
              following={following}
              postsCount={events.length + reposts.length}
              currentUserPubkey={currentUserPubkey}
              isCurrentUser={isCurrentUser}
              relays={relays}
              onRelaysChange={setRelays}
              userNpub={npub}
            />
            
            <ProfileTabs 
              events={events}
              media={media}
              reposts={reposts}
              profileData={profileData}
              originalPostProfiles={originalPostProfiles}
            />
          </>
        ) : (
          <ProfileNotFound />
        )}
      </div>
    </>
  );
}
