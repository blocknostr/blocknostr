
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adaptedNostrService as nostrAdapter } from "@/lib/nostr/nostr-adapter";
import { formatPubkey } from "@/lib/nostr/utils/keys";

interface ArticleAuthorCardProps {
  pubkey: string;
}

const ArticleAuthorCard: React.FC<ArticleAuthorCardProps> = ({ pubkey }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const isLoggedIn = !!nostrAdapter.publicKey;
  const isCurrentUser = nostrAdapter.publicKey === pubkey;
  
  useEffect(() => {
    const fetchAuthorProfile = async () => {
      try {
        const fetchedProfile = await nostrAdapter.getUserProfile(pubkey);
        setProfile(fetchedProfile);
        
        if (isLoggedIn && !isCurrentUser) {
          const following = await nostrAdapter.isFollowing(pubkey);
          setIsFollowing(following);
        }
      } catch (error) {
        console.error("Error fetching author profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAuthorProfile();
  }, [pubkey, isLoggedIn, isCurrentUser]);
  
  const handleFollow = async () => {
    if (!isLoggedIn) return;
    
    try {
      if (isFollowing) {
        await nostrAdapter.unfollowUser(pubkey);
        setIsFollowing(false);
      } else {
        await nostrAdapter.followUser(pubkey);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow status:", error);
    }
  };
  
  // Prepare display name and avatar
  const name = profile?.name || profile?.display_name || formatPubkey(pubkey);
  const about = profile?.about || "No bio provided";
  const avatar = profile?.picture || "";
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>
              {name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">
                  <Link 
                    to={`/profile/${pubkey}`}
                    className="hover:underline"
                  >
                    {name}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {formatPubkey(pubkey)}
                </p>
              </div>
              
              {isLoggedIn && !isCurrentUser && (
                <Button 
                  size="sm"
                  variant={isFollowing ? "outline" : "default"}
                  onClick={handleFollow}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
              )}
              
              {isCurrentUser && (
                <Button size="sm" variant="outline" asChild>
                  <Link to="/profile/edit">Edit Profile</Link>
                </Button>
              )}
            </div>
            
            <p className="mt-2 text-sm line-clamp-2">{about}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArticleAuthorCard;
