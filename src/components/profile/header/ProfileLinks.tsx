
import React from 'react';
import { Link, Globe, Twitter, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileLinksProps {
  website?: string;
  twitter?: string;
  nip05?: string;
  nip05Verified: boolean;
  xVerified: boolean;
  xVerifiedInfo: any;
  creationDate: string;
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
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-2">
      {/* Website link */}
      {website && (
        <a 
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Globe className="h-4 w-4" />
          {new URL(website.startsWith('http') ? website : `https://${website}`).hostname}
        </a>
      )}
      
      {/* X/Twitter link */}
      {(twitter || xVerified) && (
        <a 
          href={`https://x.com/${xVerified ? xVerifiedInfo?.username : twitter?.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-primary transition-colors"
        >
          <Twitter className="h-4 w-4" />
          @{xVerified ? xVerifiedInfo?.username : twitter?.replace('@', '')}
        </a>
      )}
      
      {/* NIP-05 identifier */}
      {nip05 && nip05Verified && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1 cursor-help">
                <Link className="h-4 w-4" />
                {nip05}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Verified Nostr identity</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* Account creation date */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-1 cursor-help">
              <Calendar className="h-4 w-4" />
              Joined {creationDate}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Estimated account creation date</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ProfileLinks;
