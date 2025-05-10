
import React from "react";
import { Globe, Link2, Twitter, ExternalLink, Calendar, BadgeCheck } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";

interface ProfileLinksProps {
  website?: string;
  twitter?: string;
  nip05?: string;
  nip05Verified: boolean | null;
  xVerified: boolean;
  xVerifiedInfo: { username: string; tweetId: string } | null;
  creationDate: Date;
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
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-4">
      {website && (
        <a 
          href={website.startsWith('http') ? website : `https://${website}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:underline hover:text-foreground transition-colors"
        >
          <Globe className="h-3.5 w-3.5" />
          {website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      
      {(twitter || xVerifiedInfo?.username) && (
        <a 
          href={`https://x.com/${(twitter || xVerifiedInfo?.username || '').replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:underline hover:text-foreground transition-colors"
        >
          <Twitter className="h-3.5 w-3.5" />
          @{(twitter || xVerifiedInfo?.username || '').replace('@', '')}
          {xVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center">
                    <BadgeCheck className="h-3.5 w-3.5 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p>Verified X account (NIP-39)</p>
                    {xVerifiedInfo?.tweetId && (
                      <a 
                        href={`https://x.com/status/${xVerifiedInfo.tweetId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-xs flex items-center"
                      >
                        View proof <ExternalLink className="h-2.5 w-2.5 ml-1" />
                      </a>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
      
      {nip05 && (
        <div className="flex items-center gap-1">
          <Link2 className="h-3.5 w-3.5" />
          <span className={nip05Verified === true ? "text-green-600" : ""}>
            {nip05}
            {nip05Verified === true && " ✓"}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-1">
        <Calendar className="h-3.5 w-3.5" />
        <span>Joined {formatDistanceToNow(creationDate, { addSuffix: true })}</span>
      </div>
    </div>
  );
};

export default ProfileLinks;
