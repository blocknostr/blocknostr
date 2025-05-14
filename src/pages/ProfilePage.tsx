
import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useProfileRelations } from '@/hooks/profile/useProfileRelations';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useUnifiedProfileFetcher } from '@/hooks/useUnifiedProfileFetcher';
import { useProfileRelays } from '@/hooks/profile/useProfileRelays';

// Lazy load components that aren't needed immediately
const LazyProfileTabs = React.lazy(() => import('@/components/profile/ProfileTabs'));

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const { profile, loading: profileLoading } = useBasicProfile(npub);
  const { profiles, fetchProfile } = useUnifiedProfileFetcher();
  
  // Get the current user's pubkey
  const currentUserPubkey = nostrService.publicKey;
  
  // Convert npub to hex pubkey
  useEffect(() => {
    if (npub) {
      try {
        const hex = nostrService.getHexFromNpub(npub);
        setHexPubkey(hex);
        // Pre-fetch profile immediately 
        fetchProfile(hex);
      } catch (error) {
        console.error('Invalid npub:', error);
      }
    }
  }, [npub, fetchProfile]);
  
  // Determine if this is the current user's profile
  const isCurrentUser = currentUserPubkey === hexPubkey;
  
  // Fetch posts with limited initial count and progressive loading
  const {
    events,
    media,
    loading: postsLoading,
    error,
    refetch: refetchPosts,
    hasEvents
  } = useProfilePosts({ 
    hexPubkey,
    limit: 5 // Only load first 5 posts initially
  });
  
  // Fetch relations and relays only after profile is loaded
  const {
    followers,
    following,
    isLoading: relationsLoading,
    refetch: refetchRelations
  } = useProfileRelations({
    hexPubkey,
    isCurrentUser
  });
  
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
  
  // Only show loading for the initial profile data
  const isLoading = profileLoading;
  
  // Calculate posts count safely
  const postsCount = hasEvents && events ? events.length : undefined;
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Render profile header with stats data */}
          <ProfileHeader 
            profile={profile} 
            npub={npub} 
            hexPubkey={hexPubkey}
            followers={followers || []}
            following={following || []}
            relays={relays || []}
            isLoading={relationsLoading || relaysLoading}
            onRefresh={handleRefresh}
            currentUserPubkey={currentUserPubkey}
          />
          
          {/* Lazy load the tabs component */}
          <Suspense fallback={
            <div className="mt-6 p-4 bg-muted/40 rounded-md animate-pulse">
              <div className="h-8 bg-muted rounded mb-4"></div>
              <div className="h-24 bg-muted rounded"></div>
            </div>
          }>
            <LazyProfileTabs 
              events={events || []} 
              media={media || []}
              reposts={[]}
              profileData={profile}
              originalPostProfiles={profiles}
              hexPubkey={hexPubkey}
            />
          </Suspense>
        </>
      )}
    </div>
  );
};

export default ProfilePage;
