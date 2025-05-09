
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { nostrService } from "@/lib/nostr";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VotersListProps {
  voters: string[];
  maxDisplay?: number;
}

const VotersList = ({ voters, maxDisplay = 5 }: VotersListProps) => {
  if (!voters.length) return null;
  
  const displayVoters = voters.slice(0, maxDisplay);
  const remainingCount = voters.length - maxDisplay;
  
  return (
    <div className="flex -space-x-2 overflow-hidden">
      <TooltipProvider>
        {displayVoters.map((voter, i) => (
          <Tooltip key={voter}>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${voter.substring(0, 8)}`} />
                  <AvatarFallback>{voter.substring(0, 2)}</AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {nostrService.getNpubFromHex(voter).substring(0, 12)}...
            </TooltipContent>
          </Tooltip>
        ))}
        
        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-muted text-xs font-medium border-2 border-background">
                +{remainingCount}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {remainingCount} more {remainingCount === 1 ? 'voter' : 'voters'}
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
};

export default VotersList;
