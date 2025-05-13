
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, ExternalLink, Globe, Twitter } from "lucide-react";
import { nostrService } from "@/lib/nostr";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EditProfileDialog from "@/components/profile/EditProfileDialog";

interface MyCubeHeaderProps {
  profileData: any | null;
  isCurrentUser: boolean;
  onProfileUpdated: () => void;
}

const MyCubeHeader = ({ profileData, isCurrentUser, onProfileUpdated }: MyCubeHeaderProps) => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  
  if (!profileData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-background">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          We couldn't load your profile data.
        </p>
        <Button onClick={onProfileUpdated}>
          Try Again
        </Button>
      </div>
    );
  }

  const banner = profileData.banner;
  const picture = profileData.picture;
  const displayName = profileData.display_name || profileData.name || "Unnamed";
  const username = profileData.name || "";
  const about = profileData.about;
  const nip05 = profileData.nip05;
  const website = profileData.website;
  const twitter = profileData.twitter;

  // Check NIP-05 verification status
  const nip05Verified = !!nip05;

  return (
    <>
      <Card className="border-none shadow-lg overflow-hidden">
        {/* Banner */}
        <div className="h-40 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          {banner && (
            <img
              src={banner}
              alt="Profile Banner"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
        </div>
        
        <CardContent className="pt-0 relative">
          {/* Profile Picture */}
          <div className="absolute -top-12 left-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-300 to-purple-400 border-4 border-background overflow-hidden">
              {picture ? (
                <img
                  src={picture}
                  alt={displayName}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-white font-bold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          
          {/* Edit Profile Button for Current User */}
          {isCurrentUser && (
            <div className="flex justify-end mb-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditProfileOpen(true)}
                className="mt-3"
              >
                Edit Profile
              </Button>
            </div>
          )}
          
          {/* Profile Info */}
          <div className="mt-12">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              {nip05Verified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>NIP-05 Verified: {nip05}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {username && (
              <p className="text-muted-foreground">@{username}</p>
            )}
            
            {about && (
              <p className="mt-3 whitespace-pre-wrap">{about}</p>
            )}
            
            {/* Links and verification */}
            <div className="flex flex-wrap gap-4 mt-4">
              {website && (
                <a 
                  href={website.startsWith('http') ? website : `https://${website}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                  <Globe className="h-4 w-4 mr-1" />
                  {new URL(website.startsWith('http') ? website : `https://${website}`).hostname}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
              
              {twitter && (
                <a 
                  href={`https://twitter.com/${twitter.replace('@', '')}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                  <Twitter className="h-4 w-4 mr-1" />
                  @{twitter.replace('@', '')}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              )}
              
              {nip05 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  {nip05}
                </div>
              )}
              
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Joined {new Date((profileData.created_at || Date.now() / 1000) * 1000).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        profileData={profileData}
        onProfileUpdated={onProfileUpdated}
      />
    </>
  );
};

export default MyCubeHeader;
