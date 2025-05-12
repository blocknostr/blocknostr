
'use client';

import { useEffect } from "react";
import { nostrService } from "@/lib/nostr";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileStats from "@/components/profile/ProfileStats";
import ProfileLoading from "@/components/profile/ProfileLoading";
import ProfileNotFound from "@/components/profile/ProfileNotFound";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useProfileData } from "@/hooks/useProfileData";

export default function ProfileDetailPage({
  params
}: {
  params: { pubkey: string }
}) {
  const { pubkey } = params;
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
  } = useProfileData({ npub: pubkey, currentUserPubkey });
  
  if (loading) {
    return <ProfileLoading />;
  }
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-4">
      {profileData ? (
        <>
          <ProfileHeader 
            profileData={profileData}
            npub={pubkey}
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
            userNpub={pubkey}
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
  );
}
