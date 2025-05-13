
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';
import { Skeleton } from '@/components/ui/skeleton';

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
  const {
    events,
    media,
    loading: postsLoading,
    error,
    refetch
  } = useProfilePosts({ 
    hexPubkey,
    limit: 10 // Only load first 10 posts initially
  });
  
  // Fast-loading flag for the profile itself
  const isProfileLoading = profileLoading && !profile;
  
  if (!npub || !hexPubkey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Invalid Profile</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {isProfileLoading ? (
        <div className="space-y-4">
          {/* Profile header skeleton loader */}
          <div className="pb-6 border-b">
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full max-w-md mb-2" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
      ) : (
        <>
          {/* Show profile header immediately once available */}
          <ProfileHeader 
            profile={profile} 
            npub={npub} 
            hexPubkey={hexPubkey} 
          />
          
          {postsLoading && events.length === 0 ? (
            <div className="mt-6">
              <div className="border-b pb-3 mb-4">
                <Skeleton className="h-8 w-full max-w-xs mb-4" />
              </div>
              {/* Post skeleton loaders */}
              {[1, 2, 3].map(i => (
                <div key={i} className="border rounded-md p-4 mb-4">
                  <div className="flex items-center space-x-4 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <ProfileTabs 
              events={events} 
              media={media}
              reposts={[]}
              profileData={profile}
              originalPostProfiles={profiles}
              hexPubkey={hexPubkey}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ProfilePage;
