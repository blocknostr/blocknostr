
import React, { useState, useEffect } from 'react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfilePictureFromPubkey, getDisplayNameFromPubkey } from '@/lib/nostr/utils/nip/nip27';
import { unifiedProfileService } from '@/lib/services/UnifiedProfileService';

interface ProfileHoverCardProps {
  pubkey: string;
  children: React.ReactNode;
  className?: string;
}

const ProfileHoverCard: React.FC<ProfileHoverCardProps> = ({ pubkey, children, className }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!pubkey) return;
    
    const loadProfile = async () => {
      try {
        setLoading(true);
        const profileData = await unifiedProfileService.getProfile(pubkey);
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to load profile for hover card:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [pubkey]);
  
  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <span className={className}>{children}</span>
      </HoverCardTrigger>
      
      <HoverCardContent className="w-72">
        {loading ? (
          <div className="flex space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-4 w-[100px]" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.picture} alt={profile?.name || 'User'} />
                <AvatarFallback>
                  {(profile?.name || profile?.display_name || pubkey?.substring(0, 2))?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">
                  {profile?.display_name || profile?.name || `${pubkey.substring(0, 6)}...${pubkey.substring(pubkey.length - 4)}`}
                </h4>
                {profile?.nip05 && (
                  <p className="text-xs text-muted-foreground">
                    {profile.nip05}
                  </p>
                )}
              </div>
            </div>
            
            {profile?.about && (
              <p className="text-xs text-muted-foreground line-clamp-3">
                {profile.about}
              </p>
            )}
            
            {/* Display some basic stats if available */}
            {/* This could be enhanced with follower counts etc. */}
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

export default ProfileHoverCard;
