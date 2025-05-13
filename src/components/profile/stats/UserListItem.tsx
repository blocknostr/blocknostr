
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";
import FollowButton from "@/components/FollowButton";

interface UserListItemProps {
  pubkey: string;
  currentUserPubkey: string | null;
}

const UserListItem = ({ pubkey, currentUserPubkey }: UserListItemProps) => {
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const npub = nostrService.getNpubFromHex(pubkey);
  const shortNpub = `${npub.substring(0, 8)}...${npub.substring(npub.length - 5)}`;
  
  // Load profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        const profile = await nostrService.getUserProfile(pubkey);
        if (profile) {
          setProfileData(profile);
        }
      } catch (e) {
        console.error('Failed to fetch profile metadata:', e);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [pubkey]);
  
  const name = profileData?.display_name || profileData?.name || shortNpub;
  const username = profileData?.name || shortNpub;
  const avatarFallback = name.charAt(0).toUpperCase();
  
  return (
    <div className="flex items-center justify-between">
      <Link to={`/profile/${npub}`} className="flex items-center gap-3 flex-1 hover:bg-muted/50 p-2 rounded-md">
        <Avatar className="h-10 w-10">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center bg-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <AvatarImage src={profileData?.picture} />
              <AvatarFallback className="bg-primary/10 text-primary">{avatarFallback}</AvatarFallback>
            </>
          )}
        </Avatar>
        <div>
          <div className="font-medium">{isLoading ? "Loading..." : name}</div>
          <div className="text-sm text-muted-foreground">@{isLoading ? shortNpub : username}</div>
        </div>
      </Link>
      
      {currentUserPubkey && currentUserPubkey !== pubkey && (
        <FollowButton pubkey={pubkey} />
      )}
    </div>
  );
};

export default UserListItem;
