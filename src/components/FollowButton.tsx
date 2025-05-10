
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { nostrService } from "@/lib/nostr";
import { User, UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
      const followingStatus = nostrService.isFollowing(pubkey);
      console.log(`Follow status for ${pubkey}: ${followingStatus}`);
      setIsFollowing(followingStatus);
    }
  }, [pubkey, currentUserPubkey]);
  
  const handleFollowToggle = async () => {
    if (!currentUserPubkey) {
      toast.error("You need to be logged in to follow users");
      return;
    }
    
    setLoading(true);
    
    try {
      if (isFollowing) {
        console.log(`Attempting to unfollow user: ${pubkey}`);
        const success = await nostrService.unfollowUser(pubkey);
        if (success) {
          setIsFollowing(false);
          toast.success("Unfollowed user");
          console.log("Unfollow successful");
        } else {
          toast.error("Failed to unfollow user");
          console.error("Unfollow failed");
        }
      } else {
        console.log(`Attempting to follow user: ${pubkey}`);
        const success = await nostrService.followUser(pubkey);
        if (success) {
          setIsFollowing(true);
          toast.success("Following user");
          console.log("Follow successful");
        } else {
          toast.error("Failed to follow user");
          console.error("Follow failed");
        }
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast.error("An error occurred");
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
