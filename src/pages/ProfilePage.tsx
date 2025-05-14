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
import { useComponentSubscriptions } from '@/hooks/useComponentSubscriptions';
import { ConnectionPool } from '@/lib/nostr/relay/connection-pool';
import { SubscriptionTracker } from '@/lib/nostr/subscription-tracker';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const [minLoadingTimeMet, setMinLoadingTimeMet] = useState(false);
  const { profile, loading: profileLoading, error: profileError } = useBasicProfile(npub);
  const { profiles, fetchProfile } = useUnifiedProfileFetcher();
  const { componentId, registerCleanup } = useComponentSubscriptions();
  
  // Get the current user's pubkey
  const currentUserPubkey = nostrService.publicKey;
  
  // Convert npub to hex pubkey
  useEffect(() => {
    let cleanupTimer: number | null = null;
    
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
    
    // Set minimum loading time for better UX
    cleanupTimer = window.setTimeout(() => {
      setMinLoadingTimeMet(true);
    }, 2000); // Reduced from 3s to 2s for faster feedback
    
    // Clean up resources when unmounting or when npub changes
    return () => {
      if (cleanupTimer) window.clearTimeout(cleanupTimer);
      
      // Explicitly clean up profile-related subscriptions when changing profile
      if (hexPubkey) {
        console.log(`[ProfilePage] Navigating away from profile ${hexPubkey.substring(0, 8)}, cleaning up subscriptions`);
        
        // Use the tracker to clean up subscriptions
        const tracker = SubscriptionTracker.getInstance();
        tracker.cleanupForComponent(componentId);
        
        // Force cleanup of potential duplicate subscriptions
        tracker.cleanupDuplicates();
      }
    };
  }, [npub, fetchProfile, componentId]);
  
  // Ensure relay connections are managed properly
  useEffect(() => {
    // Get the connection pool instance
    const connectionPool = ConnectionPool.getInstance();
    const relayCount = connectionPool.getConnectedRelays().length; // Fixed: use getConnectedRelays().length
    
    // Only connect to default relays if we don't have enough connections
    if (relayCount < 2) {
      // Connect to default relays to ensure we have at least some connections
      connectionPool.connectToRelays([
        "wss://relay.damus.io", 
        "wss://nos.lol", 
        "wss://relay.nostr.band"
      ]).catch(err => { // Fixed: Removed extra options parameter
        console.error("Failed to connect to default relays:", err);
      });
    } else {
      console.log(`[ProfilePage] Using ${relayCount} existing relay connections`);
    }
    
    // Register a cleanup function
    registerCleanup(() => {
      console.log("Profile page cleanup complete");
      // No need to disconnect - connection pool handles this globally
    });
  }, [registerCleanup]);
  
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
    limit: 5, // Only load first 5 posts initially
    componentId // Pass component ID for subscription tracking
  });
  
  // Use true lazy loading for relations/followers data - only trigger after basic profile is ready
  const {
    followers,
    following,
    isLoading: relationsLoading,
    refetch: refetchRelations
  } = useProfileRelations({
    hexPubkey,
    isCurrentUser,
    componentId // Pass component ID for subscription tracking
  });
  
  const {
    relays,
    isLoading: relaysLoading,
    refetch: refetchRelays
  } = useProfileRelays({
    hexPubkey,
    isCurrentUser,
    componentId // Pass component ID for subscription tracking
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
  
  // Show a loading state for a minimum period of time or until profile data loads
  const isInitialLoading = (profileLoading && !profile?.name && !profile?.displayName) || (!minLoadingTimeMet && !hasEvents);
  
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
