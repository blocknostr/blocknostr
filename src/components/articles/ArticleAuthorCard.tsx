import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { nostrService } from '@/lib/nostr';
import { useProfilesBatch } from '@/hooks/api/useProfileMigrated';
import { formatPubkey } from '@/lib/nostr/utils/keys';

interface ArticleAuthorCardProps {
  pubkey: string;
}

/**
 * ✅ FIXED ArticleAuthorCard - Now Uses Same Hook as ProfilePageRedux
 * Uses useProfilesBatch to match the working ProfilePageRedux implementation
 */
const ArticleAuthorCard: React.FC<ArticleAuthorCardProps> = ({ pubkey }) => {
  // ✅ FIXED: Use same hook as ProfilePageRedux for consistent data
  const { 
    profilesMap, 
    isLoading, 
    error 
  } = useProfilesBatch(pubkey && pubkey.length === 64 ? [pubkey] : []);
  
  // ✅ EXTRACT DATA SAME AS ProfilePageRedux: Direct access to metadata with fallbacks
  const profile = pubkey ? profilesMap[pubkey] : null;
  const displayName = profile?.metadata?.display_name || profile?.metadata?.name || `User ${pubkey.slice(0,8)}`;
  const name = profile?.metadata?.name || '';
  const about = profile?.metadata?.about || '';
  const picture = profile?.metadata?.picture || '';
  const followerCount = profile?.derived?.followerCount || 0;
  const hasData = !!profile;
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Check following status separately (this doesn't need Redux for now)
  useEffect(() => {
    if (pubkey) {
      try {
        const following = nostrService.isFollowing(pubkey);
        setIsFollowing(following);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    }
  }, [pubkey]);
  
  const handleFollow = async () => {
    setActionLoading(true);
    try {
      if (isFollowing) {
        await nostrService.unfollowUser(pubkey);
        setIsFollowing(false);
      } else {
        await nostrService.followUser(pubkey);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    } finally {
      setActionLoading(false);
    }
  };
  
  // ✅ IMPROVED: Prepare display data using same approach as ProfilePageRedux
  const authorData = useMemo(() => ({
    displayName: displayName || 'Anonymous',
    about: about || "No bio provided",
    avatar: picture || "",
    formattedPubkey: formatPubkey(pubkey)
  }), [displayName, about, picture, pubkey]);

  // Debug logging for development - same format as ProfilePageRedux
  if (process.env.NODE_ENV === 'development') {
    console.log('[ArticleAuthorCard] Profile state (matching ProfilePageRedux):', {
      pubkey: pubkey.slice(0, 8),
      hasData,
      displayName,
      name,
      picture: !!picture,
      isLoading,
      followerCount,
      profileMetadata: profile?.metadata,
    });
  }

  return (
    <Card className="p-4">
      <CardContent className="p-0">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            {authorData.avatar && (
              <AvatarImage 
                src={authorData.avatar} 
                alt={authorData.displayName}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-sm font-medium">
              {authorData.displayName?.charAt(0)?.toUpperCase() || pubkey.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg truncate">
                  {authorData.displayName}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {authorData.formattedPubkey}
                </p>
                {followerCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {followerCount} followers
                  </p>
                )}
              </div>
              
              <Button
                variant={isFollowing ? "outline" : "default"}
                size="sm"
                onClick={handleFollow}
                disabled={actionLoading || isLoading}
                className="ml-2"
              >
                {actionLoading ? (
                  "Loading..."
                ) : isFollowing ? (
                  "Unfollow"
                ) : (
                  "Follow"
                )}
              </Button>
            </div>
            
            {authorData.about && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {authorData.about}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleAuthorCard;

