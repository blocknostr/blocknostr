
import { Relay } from "@/lib/nostr";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RelayScoreBadgeProps {
  relay: Relay;
}

export function RelayScoreBadge({ relay }: RelayScoreBadgeProps) {
  if (relay.score === undefined) return null;
  
  // Define badge variant based on score
  let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "default";
  
  if (relay.score >= 80) badgeVariant = "default";
  else if (relay.score >= 60) badgeVariant = "secondary";
  else if (relay.score >= 40) badgeVariant = "outline";
  else badgeVariant = "destructive";
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={badgeVariant} className="ml-2">
            {relay.score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Relay performance score</p>
          {relay.avgResponse !== undefined && (
            <p className="text-xs">Avg. response: {Math.round(relay.avgResponse)}ms</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
