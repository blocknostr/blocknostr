
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Save, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { checkXVerification } from "@/lib/nostr/utils/nip/nip39";
import { isValidNip05Format } from "@/lib/nostr/utils/nip/nip05";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface YouHeaderProps {
  profileData: any;
  isEditing: boolean;
  toggleEditing: () => void;
}

const YouHeader = ({ profileData, isEditing, toggleEditing }: YouHeaderProps) => {
  const { profileData: profile, loading, refreshProfile } = profileData;
  
  const handleRefresh = async () => {
    await refreshProfile();
  };
  
  // Check for verifications
  const nip05Identifier = profile?.nip05;
  const hasValidNip05 = nip05Identifier && isValidNip05Format(nip05Identifier);
  
  const { xVerified } = checkXVerification(profile);

  if (loading) {
    return (
      <Card className="border shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-60" />
            </div>
            <div className="ml-auto">
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayName = profile?.display_name || profile?.name || "Your Profile";
  const npubShort = profileData.hexNpub ? 
    `${profileData.hexNpub.substring(0, 6)}...${profileData.hexNpub.substring(profileData.hexNpub.length - 6)}` : 
    'npub...';
  
  return (
    <Card className="border shadow-md bg-card">
      <CardContent className="p-6">
        <div className="flex items-center flex-col md:flex-row">
          <div className="flex items-center">
            {profile?.picture ? (
              <img 
                src={profile.picture} 
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-medium">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            
            <div className="ml-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">{displayName}</h2>
                <div className="flex gap-1.5">
                  {hasValidNip05 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                            {nip05Identifier}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Verified NIP-05 identifier</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {xVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">
                            X Verified
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>X/Twitter account verified via NIP-39</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
              <div className="mt-1 flex items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-muted-foreground text-sm cursor-help">{npubShort}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-mono text-xs">{profileData.hexNpub}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
          
          <div className="ml-auto mt-4 md:mt-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading || profileData.connectionStatus === 'connecting'}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button 
              variant={isEditing ? "default" : "outline"}
              size="sm" 
              onClick={toggleEditing}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Done
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default YouHeader;
