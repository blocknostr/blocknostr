
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useProfileRelations } from '@/hooks/profile/useProfileRelations';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useUnifiedProfileFetcher } from '@/hooks/useUnifiedProfileFetcher';
import { useProfileRelays } from '@/hooks/profile/useProfileRelays';
import ProfileTabs from '@/components/profile/ProfileTabs';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const { profile, loading: profileLoading, error: profileError } = useBasicProfile(npub);
  const { profiles, fetchProfile, fetchProfiles } = useUnifiedProfileFetcher();
  
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
  
  // Use true lazy loading for relations/followers data - only trigger after basic profile is ready
  const {
    followers,
    following,
    isLoading: relationsLoading,
    refetch: refetchRelations
  } = useProfileRelations({
    hexPubkey,
    isCurrentUser
  });
  
  // Pre-fetch profiles for followers and following when they change
  useEffect(() => {
    if (followers && followers.length > 0) {
      // Prioritize fetching the first 15 followers for initial display
      fetchProfiles(followers.slice(0, 15));
      
      // Fetch the rest in the background if there are more
      if (followers.length > 15) {
        setTimeout(() => {
          fetchProfiles(followers.slice(15));
        }, 2000);
      }
    }
  }, [followers, fetchProfiles]);
  
  useEffect(() => {
    if (following && following.length > 0) {
      // Prioritize fetching the first 15 following for initial display
      fetchProfiles(following.slice(0, 15));
      
      // Fetch the rest in the background if there are more
      if (following.length > 15) {
        setTimeout(() => {
          fetchProfiles(following.slice(15));
        }, 2000);
      }
    }
  }, [following, fetchProfiles]);
  
  const {
    relays,
    isLoading: relaysLoading,
    refetch: refetchRelays
  } = useProfileRelays({
    hexPubkey,
    isCurrentUser
  });
  
  // Track individual loading states for stats
  const statsLoading = {
    followers: relationsLoading,
    following: relationsLoading,
    relays: relaysLoading
  };
  
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
  
  // Show a minimal loading state only for the very initial profile data
  // Everything else will load progressively
  const isInitialLoading = profileLoading && !profile?.name && !profile?.displayName;
  
  // Calculate posts count safely
  const postsCount = hasEvents && events ? events.length : undefined;
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {isInitialLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Render profile header with stats data - show immediately even if still loading some data */}
          <ProfileHeader 
            profile={profile} 
            npub={npub} 
            hexPubkey={hexPubkey}
            followers={followers || []}
            following={following || []}
            relays={relays || []}
            statsLoading={statsLoading}
            onRefresh={handleRefresh}
            currentUserPubkey={currentUserPubkey}
          />
          
          {/* Profile tabs without suspension/lazy loading */}
          <ProfileTabs 
            events={events || []} 
            media={media || []}
            reposts={[]}
            profileData={profile}
            originalPostProfiles={profiles}
            hexPubkey={hexPubkey}
            replies={[]}
          />
        </>
      )}
    </div>
  );
};

export default ProfilePage;
