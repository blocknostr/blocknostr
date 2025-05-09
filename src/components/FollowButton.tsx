
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { User, UserCheck, Loader2 } from "lucide-react";

interface FollowButtonProps {
  pubkey: string;
  className?: string;
}

const FollowButton = ({ pubkey, className }: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentUserPubkey = nostrService.publicKey;
  
  useEffect(() => {
    // Check if user is already following this pubkey
    if (pubkey && currentUserPubkey) {
      setIsFollowing(nostrService.isFollowing(pubkey));
    }
  }, [pubkey, currentUserPubkey]);
  
  const handleFollowToggle = async () => {
    if (!currentUserPubkey) return;
    
    setLoading(true);
    
    try {
      if (isFollowing) {
        await nostrService.unfollowUser(pubkey);
        setIsFollowing(false);
      } else {
        await nostrService.followUser(pubkey);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setLoading(false);
    }
  };
  
  if (!currentUserPubkey || currentUserPubkey === pubkey) {
    return null;
  }
  
  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={className}
      onClick={handleFollowToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </>
      ) : (
        <>
          <User className="h-4 w-4 mr-2" />
          Follow
        </>
      )}
    </Button>
  );
};

export default FollowButton;
