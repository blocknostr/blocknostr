import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useProfileRelations } from '@/hooks/profile/useProfileRelations';
import { useUserProfile } from '@/hooks/queries/useProfileQueries';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';
import { useProfileRelays } from '@/hooks/profile/useProfileRelays';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EditProfileDialog } from '@/components/profile/edit-profile/EditProfileDialog'; // Import EditProfileDialog

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false); // State for dialog

  // Convert npub to hex pubkey
  useEffect(() => {
    if (npub) {
      try {
        const hex = nostrService.getHexFromNpub(npub);
        setHexPubkey(hex);
      } catch (error) {
        console.error('Invalid npub:', error);
        setHexPubkey(undefined); // Ensure hexPubkey is undefined on error
      }
    } else {
      setHexPubkey(undefined);
    }
  }, [npub]);

  // Fetch profile data using React Query
  const {
    data: userProfileData,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchUserProfile // Added refetch for profile
  } = useUserProfile(hexPubkey, { enabled: !!hexPubkey });

  // Corrected useProfileFetcher call - it no longer returns fetchProfileData
  // If originalPostProfiles is truly needed, ensure pubkeys are passed appropriately.
  // For now, passing an empty array to avoid initial errors, but this needs review based on actual need.
  const { profiles: originalPostProfiles } = useProfileFetcher({ pubkeys: [] });
  const currentUserPubkey = nostrService.publicKey;
  const isCurrentUser = currentUserPubkey === hexPubkey;

  const {
    events,
    media,
    loading: postsLoading,
    error: postsError, // This is a string
    refetch: refetchPosts
  } = useProfilePosts({
    hexPubkey,
    limit: 10
  });

  const {
    followers,
    following,
    isLoading: relationsLoading,
    hasError: relationsHasError, // Corrected: use hasError
    errorMessage: relationsErrorMessage, // Corrected: use errorMessage
    refetch: refetchRelations
  } = useProfileRelations({
    hexPubkey,
    isCurrentUser
  });

  const {
    relays,
    isLoading: relaysLoading,
    hasError: relaysHasError, // Corrected: use hasError
    errorMessage: relaysErrorMessage, // Corrected: use errorMessage
    refetch: refetchRelays
  } = useProfileRelays({
    hexPubkey,
    isCurrentUser
  });

  // Combined refetch function
  const handleRefresh = () => {
    if (hexPubkey) { // Only refetch if hexPubkey is valid
      refetchUserProfile();
    }
    refetchPosts();
    refetchRelations();
    refetchRelays();
  };

  if (!npub || !hexPubkey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Invalid Profile Identifier</h1>
        <p className="text-muted-foreground">The profile ID (npub) in the URL is missing or invalid.</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Error Loading Profile</h1>
        <p className="text-muted-foreground">{profileError.message || "Could not load the profile data."}</p>
        <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
      </div>
    );
  }

  // Overall loading state: true if profile is loading, or if posts are loading and no events yet.
  const isLoadingPage = isProfileLoading || (postsLoading && events.length === 0);

  return (
    <div className="container mx-auto px-4 py-6 max-w-full md:max-w-4xl lg:max-w-5xl">
      {isLoadingPage ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : !userProfileData ? ( // Handle case where profile data is not available after loading
        <div className="flex flex-col items-center justify-center py-20">
          <h1 className="text-xl font-semibold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground">This profile could not be loaded. It might not exist or there was an issue fetching it.</p>
          <Button onClick={handleRefresh} className="mt-4">Try Again</Button>
        </div>
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <ProfileHeader
              profile={userProfileData}
              npub={npub}
              hexPubkey={hexPubkey}
              isCurrentUser={isCurrentUser}
              onEditProfile={() => setIsEditDialogOpen(true)} // Add onEditProfile prop
            />
          </Card>
          <Card className="overflow-hidden">
            <ProfileStats
              followers={followers}
              following={following}
              postsCount={events.length} // Consider if this should come from profile data if available
              currentUserPubkey={currentUserPubkey}
              isCurrentUser={isCurrentUser}
              relays={relays}
              userNpub={npub} // Pass npub
              isLoading={relationsLoading || relaysLoading}
              onRefresh={handleRefresh}
            />
          </Card>
          <Card className="overflow-hidden">
            <ProfileTabs
              events={events}
              media={media}
              reposts={[]} // Keep as is for now
              profileData={userProfileData} // Use data from useUserProfile
              originalPostProfiles={originalPostProfiles} // from useProfileFetcher
              hexPubkey={hexPubkey} // Already have hexPubkey
            />
          </Card>
        </div>
      )}
      {/* Display errors from other hooks if they occur */}
      {postsError && <p className="text-red-500 text-center mt-4">Error loading posts: {postsError}</p>} {/* Corrected: postsError is a string */}
      {relationsHasError && <p className="text-red-500 text-center mt-4">Error loading relations: {relationsErrorMessage || 'Unknown error'}</p>} {/* Corrected */}
      {relaysHasError && <p className="text-red-500 text-center mt-4">Error loading relays: {relaysErrorMessage || 'Unknown error'}</p>} {/* Corrected */}

      {/* Edit Profile Dialog */}
      {hexPubkey && (
        <EditProfileDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          profilePubkey={hexPubkey}
        />
      )}
    </div>
  );
};

export default ProfilePage;
// Note: Button component might need to be imported if not already globally available or via another import.
// For now, assuming Button is available. If not: import { Button } from '@/components/ui/button';
