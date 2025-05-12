
import React from 'react';
import { ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ProfileLinksProps {
  website?: string;
  twitter?: string;
  nip05?: string;
  nip05Verified?: boolean | null;
  xVerified?: boolean;
  xVerifiedInfo?: { username: string; tweetId: string } | null;
  creationDate?: Date | null;
}

const ProfileLinks = ({ 
  website, 
  twitter, 
  nip05, 
  nip05Verified,
  xVerified,
  xVerifiedInfo,
  creationDate
}: ProfileLinksProps) => {
  // Format the date as a string if it exists, with proper null check and try/catch
  const formattedDate = React.useMemo(() => {
    if (!creationDate || !(creationDate instanceof Date)) {
      return null;
    }
    
    try {
      return creationDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  }, [creationDate]);

  return (
    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
      {website && (
        <div className="flex items-center gap-1">
          <ExternalLink className="h-4 w-4" />
          <a 
            href={website.startsWith('http') ? website : `https://${website}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {website.replace(/^https?:\/\//, '')}
          </a>
        </div>
      )}
      
      {twitter && (
        <div className="flex items-center gap-1">
          <span className="text-[#1DA1F2]">𝕏</span>
          <a 
            href={`https://x.com/${twitter.replace('@', '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {twitter.startsWith('@') ? twitter : `@${twitter}`}
          </a>
          {xVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30 px-1">
                    ✓
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>X Verified (NIP-39)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      {nip05 && (
        <div className="flex items-center gap-1">
          <span>✉️</span>
          <span>{nip05}</span>
          {nip05Verified === true && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Verified NIP-05 identifier</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      
      {formattedDate && (
        <div className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          <span>Joined {formattedDate}</span>
        </div>
      )}
    </div>
  );
};

export default ProfileLinks;
