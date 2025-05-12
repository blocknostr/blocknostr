
import React from "react";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";

interface ProfileIdentityProps {
  npub: string;
  pubkeyHex: string;
  shortNpub: string;
}

const ProfileIdentity = ({ npub, pubkeyHex, shortNpub }: ProfileIdentityProps) => {
  return (
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
  );
};

export default ProfileIdentity;
