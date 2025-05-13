import React, { useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { nostrService } from '@/lib/nostr';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useProfileRelations } from '@/hooks/profile/useProfileRelations';
import { useProfileRelays } from '@/hooks/profile/useProfileRelays';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';

import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabs from '@/components/profile/ProfileTabs';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();

  // 🔐 Attempt to convert npub to hex pubkey
  const hexPubkey = useMemo(() => {
    try {
      return npub ? nostrService.getHexFromNpub(npub) : undefined;
    } catch (error) {
      console.error('Invalid npub:', error);
      return undefined;
    }
  }, [npub]);

  // 📌 Derived state
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUser = useMemo(
    () => currentUserPubkey === hexPubkey,
    [currentUserPubkey, hexPubkey]
  );

  // 📄 Load base profile data
  const { profile, loading: profileLoading } = useBasicProfile(npub);
  const { profiles, fetchProfileData } = useProfileFetcher();

  // 📝 Load posts & media
  const {
    events,
    media,
    loading: postsLoading,
    error,
    refetch: refetchPosts
  } = useProfilePosts({
    hexPubkey,
    limit: 10
  });

  // 👥 Load followers/following
  const {
    followers,
    following,
    isLoading: relationsLoading,
    refetch: refetchRelations
  } = useProfileRelations({
    hexPubkey,
    isCurrentUser
  });

  // 🔁 Load relay preferences
  const {
    relays,
    isLoading: relaysLoading,
    refetch: refetchRelays
  } = useProfileRelays({
    hexPubkey,
    isCurrentUser
  });

  // 🔁 Refetch everything
  const handleRefresh = () => {
    refetchPosts();
    refetchRelations();
    refetchRelays();
  };

  // 🧠 Prefetch full profile hydration
  useEffect(() => {
    if (hexPubkey) {
      fetchProfileData(hexPubkey);
    }
  }, [hexPubkey, fetchProfileData]);

  const isLoading = useMemo(
    () => profileLoading || (postsLoading && events.length === 0),
    [profileLoading, postsLoading, events.length]
  );

  // ❌ Invalid or missing npub
  if (!npub || !hexPubkey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Invalid Profile</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }

  // ❌ Valid npub, but failed to load profile
  if (!isLoading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Profile Not Found</h1>
        <p className="text-muted-foreground">This profile could not be loaded.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : (
        <>
          <ProfileHeader
            profile={profile}
            npub={npub}
            hexPubkey={hexPubkey}
          />

          <ProfileStats
            followers={followers}
            following={following}
            postsCount={events.length}
            currentUserPubkey={currentUserPubkey}
            isCurrentUser={isCurrentUser}
            relays={relays}
            userNpub={npub}
            isLoading={relationsLoading || relaysLoading}
            onRefresh={handleRefresh}
          />

          <ProfileTabs
            events={events}
            media={media}
            reposts={[]} // Optionally load reposts later
            profileData={profile}
            originalPostProfiles={profiles}
            hexPubkey={hexPubkey}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;