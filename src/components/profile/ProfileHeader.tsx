
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MessageSquare, Edit, Globe, Link2, ExternalLink, Calendar, Check, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [profile, setProfile] = useState(profileData);
  const [nip05Verified, setNip05Verified] = useState<boolean | null>(null);
  const [verifyingNip05, setVerifyingNip05] = useState(false);
  
  const formattedNpub = npub || '';
  const shortNpub = `${formattedNpub.substring(0, 8)}...${formattedNpub.substring(formattedNpub.length - 8)}`;
  
  const displayName = profile?.display_name || profile?.name || shortNpub;
  const username = profile?.name || shortNpub;
  const avatarFallback = displayName.charAt(0).toUpperCase();
  
  const pubkeyHex = npub.startsWith('npub1') ? nostrService.getHexFromNpub(npub) : npub;
  
  // Get account creation date (using NIP-01 bech32 encoding timestamp)
  const creationDate = npub ? new Date() : new Date(); // Placeholder, would need actual creation date logic
  
  const handleProfileUpdated = () => {
    // Update the profile state with the new data
    // In a real app, you might want to fetch the latest profile data from the network
    setProfile(profileData);
  };

  // Verify NIP-05 identifier when profile data changes
  useEffect(() => {
    const verifyNip05 = async () => {
      if (!profile?.nip05 || !pubkeyHex) return;
      
      setVerifyingNip05(true);
      try {
        const isVerified = await nostrService.verifyNip05(profile.nip05, pubkeyHex);
        setNip05Verified(isVerified);
      } catch (error) {
        console.error('Error verifying NIP-05:', error);
        setNip05Verified(false);
      } finally {
        setVerifyingNip05(false);
      }
    };
    
    verifyNip05();
  }, [profile?.nip05, pubkeyHex]);
  
  return (
    <div className="mb-6">
      {/* Banner */}
      <div 
        className="h-48 md:h-64 bg-gradient-to-r from-violet-500 to-fuchsia-500 w-full rounded-t-lg"
        style={profile?.banner ? { 
          backgroundImage: `url(${profile.banner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : {}}
      ></div>
      
      {/* Profile info */}
      <Card className="border-none shadow-lg relative -mt-5">
        <CardContent className="pt-6 relative">
          <Avatar className="h-24 w-24 md:h-32 md:w-32 absolute -top-16 left-4 border-4 border-background shadow-xl">
            <AvatarImage src={profile?.picture} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-16 md:mt-20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  {profile?.nip05 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            nip05Verified === true 
                              ? "bg-green-500/10 text-green-600" 
                              : nip05Verified === false 
                                ? "bg-red-500/10 text-red-600"
                                : "bg-gray-500/10 text-gray-600"
                          }`}>
                            {nip05Verified === true ? (
                              <>
                                <Check className="h-3 w-3" />
                                Verified
                              </>
                            ) : nip05Verified === false ? (
                              <>
                                <AlertCircle className="h-3 w-3" />
                                Unverified
                              </>
                            ) : (
                              <>Verifying...</>
                            )}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{profile.nip05}</p>
                          {nip05Verified === true ? (
                            <p className="text-green-600">✓ NIP-05 verified</p>
                          ) : nip05Verified === false ? (
                            <p className="text-red-600">✗ NIP-05 verification failed</p>
                          ) : (
                            <p>Verifying NIP-05 identifier...</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                  <Button variant="outline" onClick={() => setIsEditProfileOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit profile
                  </Button>
                ) : (
                  <FollowButton pubkey={nostrService.getHexFromNpub(npub || '')} />
                )}
              </div>
            </div>
            
            {profile?.about && (
              <p className="my-4 whitespace-pre-wrap">{profile.about}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-4">
              {profile?.website && (
                <a 
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:underline hover:text-foreground transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profile.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              
              {profile?.nip05 && (
                <div className="flex items-center gap-1">
                  <Link2 className="h-3.5 w-3.5" />
                  <span className={nip05Verified === true ? "text-green-600" : ""}>
                    {profile.nip05}
                    {nip05Verified === true && " ✓"}
                  </span>
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
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        profileData={profile}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default ProfileHeader;
