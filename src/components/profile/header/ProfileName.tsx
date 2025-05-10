
import React from "react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Check, AlertCircle } from "lucide-react";

interface ProfileNameProps {
  displayName: string;
  username: string;
  nip05?: string;
  nip05Verified: boolean | null;
}

const ProfileName = ({ displayName, username, nip05, nip05Verified }: ProfileNameProps) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold">{displayName}</h2>
        {nip05 && (
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
                <p>{nip05}</p>
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
    </div>
  );
};

export default ProfileName;
