
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const XVerificationTooltip = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>You can verify your X (Twitter) account by posting a verification tweet.</p>
          <p className="mt-2">This follows the NIP-39 protocol for cross-platform identity verification.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XVerificationTooltip;
