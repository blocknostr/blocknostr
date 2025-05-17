
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserX, Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface KickProposal {
  id: string;
  daoId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
  status: "active" | "passed" | "rejected" | "canceled";
  targetPubkey: string;
}

interface DAOKickProposalsListProps {
  proposals: KickProposal[];
  currentUserPubkey: string | null;
  onVote: (proposalId: string, vote: boolean) => Promise<boolean>;
  isLoading: boolean;
}

const DAOKickProposalsList: React.FC<DAOKickProposalsListProps> = ({
  proposals,
  currentUserPubkey,
  onVote,
  isLoading
}) => {
  const [isVoting, setIsVoting] = useState<Record<string, boolean>>({});
  
  // Handle empty states consistently
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (proposals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <UserX className="h-12 w-12 mb-4 opacity-50" />
            <p>No active kick proposals</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Handle vote submission with proper boolean parameters
  const handleVote = async (proposalId: string, vote: boolean) => {
    setIsVoting(prev => ({ ...prev, [proposalId]: true }));
    try {
      await onVote(proposalId, vote);
    } finally {
      setIsVoting(prev => ({ ...prev, [proposalId]: false }));
    }
  };
  
  return (
    <div className="space-y-4">
      {proposals.map(proposal => {
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
        
        // Parse the reason from description
        let reason = "No reason provided";
        try {
          const content = JSON.parse(proposal.description);
          reason = content.reason || reason;
        } catch (e) {}
        
        // Format the target pubkey for better readability
        const displayTargetPubkey = `${proposal.targetPubkey.substring(0, 12)}...${proposal.targetPubkey.substring(60)}`;
        
        return (
          <Card key={proposal.id} className="border-red-200 bg-red-50/30 dark:bg-red-900/5">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <UserX className="h-5 w-5 mr-2 text-red-600" />
                    {proposal.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <div className="flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {isActive ? `Ends ${timeRemaining}` : `Ended ${timeRemaining}`}
                      <span className="mx-2">•</span>
                      {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                    </div>
                  </CardDescription>
                </div>
                <Badge className={isActive ? "bg-green-500" : "bg-gray-500"}>
                  {isActive ? "Active" : "Closed"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pb-0">
              <div className="p-4 bg-red-100/50 rounded-md mb-4 dark:bg-red-900/10">
                <div className="flex gap-2 items-center mb-2 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Reason for removal request:</span>
                </div>
                <p className="text-sm">{reason}</p>
              </div>
              
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Target user:</p>
                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                  {displayTargetPubkey}
                </code>
              </div>
              
              <div className="space-y-4 mt-4">
                {proposal.options.map((option, index) => {
                  const isUserVote = userVote === index;
                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={isUserVote ? "font-medium text-primary" : ""}>
                          {option}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {voteCounts[index]} · {votePercentages[index]}%
                        </span>
                      </div>
                      <Progress 
                        value={votePercentages[index]} 
                        className={`h-2 ${index === 0 ? "bg-red-100 dark:bg-red-900/30" : ""} ${index === 0 ? "data-[value]:bg-red-500" : ""}`}
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
            
            <CardFooter className="pt-4 pb-4">
              {isActive && currentUserPubkey && !hasVoted && (
                <div className="grid grid-cols-2 gap-2 w-full">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleVote(proposal.id, true)} // true = vote to remove
                    disabled={isVoting[proposal.id]}
                    className="w-full"
                  >
                    Vote to Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVote(proposal.id, false)} // false = vote to keep
                    disabled={isVoting[proposal.id]}
                    className="w-full"
                  >
                    Vote to Keep
                  </Button>
                </div>
              )}
              
              {hasVoted && (
                <p className="text-xs text-center text-muted-foreground w-full">
                  You voted: <span className="font-medium">{proposal.options[userVote]}</span>
                </p>
              )}
              
              {!isActive && votePercentages[0] > 50 && (
                <div className="w-full">
                  <p className="text-sm text-center font-medium text-red-600 mb-1">
                    This member has been removed from the DAO
                  </p>
                  <p className="text-xs text-center text-muted-foreground">
                    {votePercentages[0]}% voted for removal (threshold: 51%)
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default DAOKickProposalsList;
