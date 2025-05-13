
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
  
  if (!npub || !hexPubkey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Invalid Profile</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }
  
  // Show the profile header as soon as profile data is loaded
  // Only show full loading state when both profile and posts are loading
  const isLoading = profileLoading || (postsLoading && events.length === 0);
  
  // Show a skeleton state while posts are loading but profile is ready
  const showPostsSkeleton = !profileLoading && postsLoading && events.length === 0;
  
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
          
          {showPostsSkeleton ? (
            <div className="mt-6 space-y-4">
              {/* Tab skeleton */}
              <div className="border-b pb-2 flex space-x-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
              
              {/* Post skeletons */}
              <div className="space-y-4 mt-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-24 w-full" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                ))}
              </div>
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
