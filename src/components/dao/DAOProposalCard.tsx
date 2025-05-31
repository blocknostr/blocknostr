
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { DAOProposal } from '@/api/types/dao';
import { ChevronDown, ChevronUp, Clock, Check, X, Users, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toast } from "@/lib/toast";
import { cn } from '@/lib/utils';

interface DAOProposalCardProps {
  proposal: DAOProposal;
  currentUserPubkey: string | null;
  onVote: (proposalId: string, optionIndex: number) => Promise<boolean>;
  isMember: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  id?: string;
  className?: string;
}

const DAOProposalCard: React.FC<DAOProposalCardProps> = ({
  proposal,
  currentUserPubkey,
  onVote,
  isMember,
  isExpanded,
  onToggleExpanded,
  id,
  className
}) => {
  const [isVoting, setIsVoting] = React.useState<number | null>(null);
  const hasVoted = currentUserPubkey && proposal.votes && proposal.votes[currentUserPubkey] !== undefined;
  const userVote = hasVoted && currentUserPubkey ? proposal.votes[currentUserPubkey] : null;
  
  // Calculate time remaining or time since closed
  const now = Math.floor(Date.now() / 1000);
  const isActive = proposal.status === "active";
  const timeDisplay = isActive 
    ? `Ends ${formatDistanceToNow(proposal.endsAt * 1000, { addSuffix: true })}`
    : `Ended ${formatDistanceToNow(proposal.endsAt * 1000, { addSuffix: true })}`;
  
  // Calculate vote counts
  const totalVotes = Object.keys(proposal.votes || {}).length;
  const voteCounts: number[] = [];
  
  for (let i = 0; i < proposal.options.length; i++) {
    const count = Object.values(proposal.votes || {}).filter(vote => vote === i).length;
    voteCounts.push(count);
  }
  
  const handleVote = async (optionIndex: number) => {
    if (!currentUserPubkey) {
      toast.error("Please log in to vote");
      return;
    }
    
    if (!isMember) {
      toast.error("Only members can vote on proposals");
      return;
    }
    
    if (!isActive) {
      toast.error("This proposal has ended");
      return;
    }
    
    if (hasVoted) {
      toast.info("You have already voted on this proposal");
      return;
    }
    
    setIsVoting(optionIndex);
    
    try {
      const success = await onVote(proposal.id, optionIndex);
      if (success) {
        toast.success(`Voted for "${proposal.options[optionIndex]}"`);
      } else {
        toast.error("Failed to cast vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Error casting vote");
    } finally {
      setIsVoting(null);
    }
  };
  
  return (
    <Card className={cn("transition-all duration-300", className)} id={id}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-lg font-semibold">{proposal.title}</CardTitle>
              <Badge variant={isActive ? "outline" : "secondary"} className="ml-2">
                {isActive ? "Active" : "Closed"}
              </Badge>
            </div>
            <CardDescription className="flex items-center text-sm">
              <Clock className="h-3 w-3 mr-1" />
              {timeDisplay}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8"
            onClick={onToggleExpanded}
          >
            {isExpanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pb-2">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-4">
            {proposal.description}
          </p>
        </CardContent>
      )}
      
      <CardContent className={cn("pb-4", !isExpanded && "pt-0")}>
        <div className="space-y-3">
          {proposal.options.map((option, index) => {
            const voteCount = voteCounts[index] || 0;
            const votePercentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const isUserVote = userVote === index;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isUserVote && <Check className="h-3 w-3 text-primary" />}
                    <span className={cn("text-sm", isUserVote && "font-medium text-primary")}>
                      {option}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({votePercentage.toFixed(0)}%)
                    </span>
                    {isActive && isMember && !hasVoted && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 px-2"
                        onClick={() => handleVote(index)}
                        disabled={!!isVoting}
                      >
                        {isVoting === index ? <Loader2 className="h-3 w-3 animate-spin" /> : "Vote"}
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={votePercentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <CardFooter>
        <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-3 w-3 mr-1" />
            <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
          </div>
          <div>
            Created by {proposal.creator.slice(0, 6)}...{proposal.creator.slice(-4)}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DAOProposalCard;

