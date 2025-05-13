
import React from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import { verifyNip05 } from "@/lib/nostr/nip05";
import { toast } from "@/hooks/use-toast";

interface UserProfileHoverCardProps {
  children: React.ReactNode;
  userProfile: {
    name?: string;
    display_name?: string;
    picture?: string;
    nip05?: string;
    about?: string;
  };
  pubkey: string;
  isLoading: boolean;
  isVerified?: boolean;
}

export const UserProfileHoverCard = ({ 
  children, 
  userProfile, 
  pubkey, 
  isLoading,
  isVerified = false
}: UserProfileHoverCardProps) => {
  const navigate = useNavigate();
  
  const handleViewProfile = () => {
    if (!pubkey) return;
    
    try {
      const npub = nostrService.getNpubFromHex(pubkey);
      if (npub) {
        navigate(`/profile/${npub}`);
      }
    } catch (error) {
      console.error("Error navigating to profile:", error);
      toast({
        title: "Navigation error",
        description: "Could not navigate to profile",
        variant: "destructive"
      });
    }
  };
  
  // Get display name with fallbacks
  const displayName = userProfile.display_name || userProfile.name || "User";
  
  // Handle short about text
  const shortAbout = userProfile.about 
    ? userProfile.about.length > 100 
      ? `${userProfile.about.substring(0, 100)}...` 
      : userProfile.about
    : "No description available";
    
  if (isLoading) {
    return children;
  }
  
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="flex flex-col space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 border">
              <AvatarImage src={userProfile.picture} alt={displayName} />
              <AvatarFallback>
                <UserRound className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{displayName}</span>
                {isVerified && userProfile.nip05 && (
                  <span className="text-primary" title="Verified user">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </div>
              
              {userProfile.nip05 && (
                <span className="text-xs text-muted-foreground">
                  {userProfile.nip05}
                </span>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewProfile}
                className="h-7 mt-2 px-2"
              >
                View profile
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {shortAbout}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
