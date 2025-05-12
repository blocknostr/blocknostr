
import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileNameProps {
  displayName: string;
  username: string;
  nip05?: string;
  nip05Verified: boolean;
}

const ProfileName = ({ displayName, username, nip05, nip05Verified }: ProfileNameProps) => {
  return (
    <div>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        {displayName}
        
        {/* NIP-05 verification indicator */}
        {nip05 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center">
                  {nip05Verified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {nip05Verified ? (
                  <p>Verified as <span className="font-semibold">{nip05}</span></p>
                ) : (
                  <p>Unverified identity: {nip05}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </h1>
      
      <p className="text-muted-foreground">@{username}</p>
    </div>
  );
};

export default ProfileName;
