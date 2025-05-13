
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { nostrService } from '@/lib/nostr';
import { Loader2 } from 'lucide-react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { useBasicProfile } from '@/hooks/useBasicProfile';
import { useOptimizedProfileData } from '@/hooks/profile/useOptimizedProfileData';
import { Skeleton } from '@/components/ui/skeleton';

const ProfilePage = () => {
  const { npub } = useParams<{ npub: string }>();
  const [hexPubkey, setHexPubkey] = useState<string | undefined>(undefined);
  const { profile, loading: profileLoading } = useBasicProfile(npub);
  
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
  
  // Use our new optimized profile data hook
  const {
    activeTab,
    handleTabChange,
    posts,
    media,
    replies,
    reactions,
    reposts,
    referencedEvents,
    originalPostProfiles,
    profiles,
    postsLoading,
    repliesLoading,
    likesLoading
  } = useOptimizedProfileData(hexPubkey);
  
  // Validate profile
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
      {/* Optimize header loading - show skeleton while loading */}
      {profileLoading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <ProfileHeader 
          profile={profile} 
          npub={npub} 
          hexPubkey={hexPubkey} 
        />
      )}
      
      {/* Always render tabs - each tab handles its own loading state */}
      <ProfileTabs 
        events={posts}
        media={media}
        reposts={reposts}
        profileData={profile}
        originalPostProfiles={originalPostProfiles}
        replies={replies}
        reactions={reactions}
        referencedEvents={referencedEvents}
        loading={{
          posts: postsLoading,
          replies: repliesLoading,
          likes: likesLoading
        }}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default ProfilePage;
