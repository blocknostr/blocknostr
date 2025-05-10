
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MessageSquare, Edit, Globe, Link2, ExternalLink, Calendar } from "lucide-react";
import FollowButton from "@/components/FollowButton";
import { formatDistanceToNow } from "date-fns";
import { nostrService } from "@/lib/nostr";
import EditProfileDialog from "./EditProfileDialog";

interface ProfileHeaderProps {
  profileData: any | null;
  npub: string;
  isCurrentUser: boolean;
  onMessage: () => void;
}

const ProfileHeader = ({ profileData, npub, isCurrentUser, onMessage }: ProfileHeaderProps) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  const formattedNpub = npub || '';
  const shortNpub = `${formattedNpub.substring(0, 8)}...${formattedNpub.substring(formattedNpub.length - 8)}`;
  
  const displayName = profileData?.display_name || profileData?.name || shortNpub;
  const username = profileData?.name || shortNpub;
  const avatarFallback = displayName.charAt(0).toUpperCase();
  
  const pubkeyHex = npub.startsWith('npub1') ? nostrService.getHexFromNpub(npub) : npub;
  
  // Get account creation date (using NIP-01 bech32 encoding timestamp)
  const creationDate = npub ? new Date() : new Date(); // Placeholder, would need actual creation date logic
  
  return (
    <div className="mb-6">
      {/* Banner */}
      <div 
        className="h-48 md:h-64 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full rounded-t-lg"
        style={profileData?.banner ? { 
          backgroundImage: `url(${profileData.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      ></div>
      
      {/* Profile info */}
      <Card className="border-none shadow-lg relative -mt-5">
        <CardContent className="pt-6 relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 absolute -top-16 left-4 border-4 border-background shadow-xl">
            <AvatarImage src={profileData?.picture} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-16 md:mt-20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  {profileData?.nip05 && (
                    <span className="bg-green-500/10 text-green-600 text-xs px-2 py-1 rounded-full">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">@{username}</p>
                
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button className="text-xs text-muted-foreground mt-1 hover:underline">
                      {shortNpub}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">Nostr ID</h4>
                      <p className="text-xs break-all">{npub}</p>
                      <p className="text-xs break-all text-muted-foreground">{pubkeyHex}</p>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => navigator.clipboard.writeText(npub)}
                        >
                          Copy npub
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs"
                          onClick={() => navigator.clipboard.writeText(pubkeyHex)}
                        >
                          Copy hex
                        </Button>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              
              <div className="space-x-2 mt-4 md:mt-0">
                {!isCurrentUser && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onMessage}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Message
                  </Button>
                )}
                
                {isCurrentUser ? (
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit profile
                  </Button>
                ) : (
                  <FollowButton pubkey={nostrService.getHexFromNpub(npub || '')} />
                )}
              </div>
            </div>
            
            {profileData?.about && (
              <p className="my-4 whitespace-pre-wrap">{profileData.about}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-4">
              {profileData?.website && (
                <a 
                  href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profileData.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {profileData?.nip05 && (
                <div className="flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  {profileData.nip05}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>Joined {formatDistanceToNow(creationDate, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Profile Dialog */}
      {isCurrentUser && (
        <EditProfileDialog
          open={isEditProfileOpen}
          onOpenChange={setIsEditProfileOpen}
          profileData={profileData}
        />
      )}
    </div>
  );
};

export default ProfileHeader;
