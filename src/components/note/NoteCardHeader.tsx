
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { Shield, CheckCircle2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NoteCardHeaderProps {
  pubkey?: string;
  profile?: any;
  timestamp?: Date;
}

const NoteCardHeader: React.FC<NoteCardHeaderProps> = ({
  pubkey,
  profile,
  timestamp
}) => {
  // Get profile information
  const name = profile?.name || pubkey?.slice(0, 8);
  const displayName = profile?.display_name || name;
  const picture = profile?.picture;
  const npub = pubkey?.slice(0, 8);
  const isVerified = profile?.nip05 !== undefined;
  
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <Avatar className="w-10 h-10 rounded-full border border-border/30">
          <AvatarImage src={picture} alt={displayName} />
          <AvatarFallback className="bg-primary/20 text-primary-foreground">
            {displayName?.substring(0, 2).toUpperCase() || '??'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="font-medium">{displayName}</span>
            {isVerified && (
              <div className="ml-1 text-primary" title="NIP-05 Verified">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span>@{npub}</span>
            {timestamp && (
              <>
                <span className="mx-1">•</span>
                <span>{formatDistanceToNow(timestamp)} ago</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
            >
              <path
                d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM13.625 7.5C13.625 8.12132 13.1213 8.625 12.5 8.625C11.8787 8.625 11.375 8.12132 11.375 7.5C11.375 6.87868 11.8787 6.375 12.5 6.375C13.1213 6.375 13.625 6.87868 13.625 7.5Z"
                fill="currentColor"
              />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Copy post link</DropdownMenuItem>
          <DropdownMenuItem>Copy post text</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Report post</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NoteCardHeader;
