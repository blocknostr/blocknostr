
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { useProfilePosts } from '@/hooks/profile/useProfilePosts';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useProfileFetcher } from '@/components/feed/hooks/use-profile-fetcher';
import ProfileLoadingSkeleton from '@/components/profile/ProfileLoadingSkeleton';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const { profile, loading: profileLoading } = useBasicProfile(npub);
  const { profiles, fetchProfileData } = useProfileFetcher();
  const [headerVisible, setHeaderVisible] = useState(false);
  
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
  
  // Show header as soon as possible
  useEffect(() => {
    if (profile && !profileLoading) {
      setHeaderVisible(true);
    }
  }, [profile, profileLoading]);

  if (!npub || !hexPubkey) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-semibold mb-2">Invalid Profile</h1>
        <p className="text-muted-foreground">The profile you're looking for doesn't exist.</p>
      </div>
    );
  }
  
  const isLoading = profileLoading && !profile;
  const isPostsLoading = postsLoading && events.length === 0;
  
  return (
    <div className="container max-w-3xl mx-auto px-4 py-6">
      {/* Always show header as soon as profile data is available */}
      {headerVisible ? (
        <ProfileHeader 
          profile={profile} 
          npub={npub} 
          hexPubkey={hexPubkey} 
        />
      ) : (
        <div className="mb-6">
          <div className="h-40 bg-muted w-full rounded-t-lg" />
          <div className="px-4 pb-4 border-b">
            <div className="flex justify-between items-start relative">
              <Skeleton className="h-24 w-24 rounded-full -mt-12 border-4 border-background" />
              <div className="mt-4">
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
            <div className="mt-3">
              <Skeleton className="h-6 w-1/3 mb-2" />
              <Skeleton className="h-4 w-1/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      ) : (
        <>
          {/* Show skeleton while posts are loading */}
          {isPostsLoading ? (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4 px-1">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <ProfileLoadingSkeleton count={3} />
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
