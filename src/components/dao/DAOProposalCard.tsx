
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { DAOProposal } from "@/types/dao";
import { formatDistanceToNow } from "date-fns";

interface DAOProposalCardProps {
  proposal: DAOProposal;
  currentUserPubkey: string | null;
  onVote: (proposalId: string, optionIndex: number) => Promise<boolean>;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

const DAOProposalCard: React.FC<DAOProposalCardProps> = ({
  proposal,
  currentUserPubkey,
  onVote,
  isExpanded,
  onToggleExpanded
}) => {
  const [isVoting, setIsVoting] = useState(false);
  
  // Calculate vote counts and percentages
  const totalVotes = Object.keys(proposal.votes).length;
  const voteCounts = proposal.options.map((_, index) => 
    Object.values(proposal.votes).filter(vote => vote === index).length
  );
  
  const votePercentages = voteCounts.map(count => 
    totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
  );
  
  // Get user's vote if they have voted
  const userVote = currentUserPubkey ? proposal.votes[currentUserPubkey] : undefined;
  const hasVoted = userVote !== undefined;
  
  // Check if proposal is active
  const now = Math.floor(Date.now() / 1000);
  const isActive = proposal.endsAt > now;
  const timeRemaining = formatDistanceToNow(new Date(proposal.endsAt * 1000), { addSuffix: true });
  
  const handleVote = async (optionIndex: number) => {
    if (!currentUserPubkey) return;
    
    setIsVoting(true);
    try {
      await onVote(proposal.id, optionIndex);
    } finally {
      setIsVoting(false);
    }
  };
  
  const getStatusBadge = () => {
    if (isActive) {
      return <Badge variant="default" className="bg-green-500">Active</Badge>;
    } else if (proposal.status === "passed") {
      return <Badge variant="default" className="bg-blue-500">Passed</Badge>;
    } else if (proposal.status === "rejected") {
      return <Badge variant="default" className="bg-red-500">Rejected</Badge>;
    } else {
      return <Badge variant="outline">Closed</Badge>;
    }
  };
  
  return (
    <Card className="w-full overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{proposal.title}</CardTitle>
            <CardDescription className="flex items-center text-xs mt-1">
              <Clock className="h-3 w-3 mr-1" />
              {isActive ? `Ends ${timeRemaining}` : `Ended ${timeRemaining}`}
              <span className="mx-2">•</span>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="pb-0">
        {!isExpanded ? (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {proposal.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            {proposal.description}
          </p>
        )}
        
        <div className="space-y-3">
          {proposal.options.map((option, index) => {
            const isUserVote = userVote === index;
            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    {isUserVote && <CheckCircle className="h-3 w-3 text-primary mr-1" />}
                    <span className={isUserVote ? "font-medium text-primary" : ""}>
                      {option}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {voteCounts[index]} · {votePercentages[index]}%
                  </span>
                </div>
                <Progress value={votePercentages[index]} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <CardFooter className="flex-col pt-4 pb-4">
        <div className="flex justify-between items-center w-full mb-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-0 text-xs text-muted-foreground hover:text-foreground"
            onClick={onToggleExpanded}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Show more
              </>
            )}
          </Button>
        </div>
        
        {isActive && currentUserPubkey && !hasVoted && (
          <div className="grid grid-cols-2 gap-2 w-full">
            {proposal.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleVote(index)}
                disabled={isVoting}
                className="w-full"
              >
                {option}
              </Button>
            ))}
          </div>
        )}
        
        {hasVoted && (
          <p className="text-xs text-center text-muted-foreground">
            You voted for <span className="font-medium">{proposal.options[userVote]}</span>
          </p>
        )}
      </CardFooter>
    </Card>
  );
};

export default DAOProposalCard;
