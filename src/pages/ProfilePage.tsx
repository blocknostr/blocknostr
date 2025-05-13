
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useProfileRelations } from '@/hooks/profile/useProfileRelations';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';
import { useProfileRelays } from '@/hooks/profile/useProfileRelays';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const { profile, loading: profileLoading } = useBasicProfile(npub);
  const { profiles, fetchProfileData } = useProfileFetcher();
  
  // Get the current user's pubkey
  const currentUserPubkey = nostrService.publicKey;
  
  // Convert npub to hex pubkey
  useEffect(() => {
    if (npub) {
      try {
        const hex = nostrService.getHexFromNpub(npub);
        setHexPubkey(hex);
      } catch (error) {
        console.error('Invalid npub:', error);
      }
    }
  }, [npub]);
  
  // Determine if this is the current user's profile
  const isCurrentUser = currentUserPubkey === hexPubkey;
  
  // Fetch posts with limited initial count
  const {
    events,
    media,
    loading: postsLoading,
    error,
    refetch: refetchPosts
  } = useProfilePosts({ 
    hexPubkey,
    limit: 10 // Only load first 10 posts initially
  });
  
  // Fetch followers and following
  const {
    followers,
    following,
    isLoading: relationsLoading,
    refetch: refetchRelations
  } = useProfileRelations({
    hexPubkey,
    isCurrentUser
  });
  
  // Fetch relays
  const {
    relays,
    isLoading: relaysLoading,
    refetch: refetchRelays
  } = useProfileRelays({
    hexPubkey,
    isCurrentUser
  });
  
  // Combined refetch function
  const handleRefresh = () => {
    refetchPosts();
    refetchRelations();
    refetchRelays();
  };
  
  if (!npub || !hexPubkey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Invalid Profile</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }
  
  const isLoading = profileLoading || (postsLoading && events.length === 0);
  
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
            reposts={[]}
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
