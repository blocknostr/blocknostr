
import { HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
          <p>Verification follows NIP-39 standard for external identity verification.</p>
          <p className="mt-2">You'll post a tweet containing your Nostr public key, and we'll add an "i" tag to your profile metadata.</p>
          <p className="mt-2">The format is: ["i", "twitter:username", "tweetId"]</p>
          <a 
            href="https://github.com/nostr-protocol/nips/blob/master/39.md" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline mt-2 block"
          >
            Learn more about NIP-39
          </a>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default XVerificationTooltip;
