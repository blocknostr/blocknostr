
import React from 'react';
import { InfoIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const XVerificationTooltip = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-[300px]">
          <div className="space-y-1.5 text-xs">
            <p>
              Verify your X (Twitter) account to display a verification badge on your profile.
            </p>
            <p>
              This uses the Nostr NIP-39 standard for cross-platform verification.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XVerificationTooltip;
