
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const { profile, loading: profileLoading } = useBasicProfile(npub);
  const { profiles, fetchProfileData } = useProfileFetcher();
  
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
  
  // Fetch posts with limited initial count
  const { events = [], media = [], loading: postsLoading, error = null, refetch = () => {} } = 
    hexPubkey ? useProfilePosts({ hexPubkey, limit: 10 }) : { events: [], media: [], loading: false, error: null, refetch: () => {} };
  
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
