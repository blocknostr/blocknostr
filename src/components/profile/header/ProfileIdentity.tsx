
import React, { useState } from 'react';
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProfileIdentityProps {
  npub: string;
  pubkeyHex: string;
  shortNpub: string;
}

const ProfileIdentity = ({ npub, pubkeyHex, shortNpub }: ProfileIdentityProps) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(npub);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground font-mono px-1 h-7"
            onClick={copyToClipboard}
          >
            {shortNpub}
            <Copy className="h-3 w-3 ml-1" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isCopied ? "Copied!" : "Click to copy Nostr public key"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ProfileIdentity;
