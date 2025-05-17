
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { DAOProposal } from '@/types/dao';
import { nostrService } from '@/lib/nostr';

interface DAOProposalCardProps {
  proposal: DAOProposal;
  onVote?: (proposalId: string, optionIndex: number) => Promise<boolean>;
  currentUserPubkey: string | null;
  isMember: boolean;
}

const DAOProposalCard: React.FC<DAOProposalCardProps> = ({
  proposal,
  onVote,
  currentUserPubkey,
  isMember
}) => {
  // Current time for checking if proposal is active
  const now = Math.floor(Date.now() / 1000);
  const isActive = proposal.status === "active" && proposal.endsAt > now;
  
  // Format end time
  const endTimeFormatted = proposal.endsAt 
    ? formatDistanceToNow(new Date(proposal.endsAt * 1000), { addSuffix: true })
    : 'Unknown';

  // Count votes
  const totalVotes = Object.keys(proposal.votes).length;
  
  // Calculate votes per option
  const votesPerOption = proposal.options.map((_, index) => {
    return Object.values(proposal.votes).filter(vote => vote === index).length;
  });
  
  // Get winning option index
  const winningOptionIndex = votesPerOption.indexOf(Math.max(...votesPerOption));
  
  // Check if current user has voted
  const userVoted = currentUserPubkey ? proposal.votes[currentUserPubkey] !== undefined : false;
  const userVoteOption = userVoted && currentUserPubkey ? proposal.votes[currentUserPubkey] : null;
  
  // Determine status badge
  const renderStatusBadge = () => {
    if (isActive) {
      return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500">Active</Badge>;
    } else if (proposal.status === "passed") {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500">Passed</Badge>;
    } else if (proposal.status === "rejected") {
      return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500">Rejected</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500">Canceled</Badge>;
    }
  };
  
  // Handle vote function
  const handleVote = (optionIndex: number) => {
    if (!isMember || !currentUserPubkey || !onVote) return;
    onVote(proposal.id, optionIndex);
  };
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{proposal.title}</CardTitle>
          {renderStatusBadge()}
        </div>
        <div className="flex items-center mt-1 text-sm text-muted-foreground">
          <Avatar className="h-5 w-5 mr-2">
            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${proposal.creator.substring(0, 8)}`} />
            <AvatarFallback>{proposal.creator.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="mr-2">
            {proposal.creator ? nostrService.getNpubFromHex(proposal.creator).substring(0, 8) + "..." : "Unknown"}
          </span>
          <span>·</span>
          {isActive ? (
            <span className="ml-2 flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              Ends {endTimeFormatted}
            </span>
          ) : (
            <span className="ml-2 flex items-center">
              {proposal.status === "passed" ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 mr-1 text-red-500" />
              )}
              Ended {endTimeFormatted}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-sm mb-6">{proposal.description}</div>
        
        {/* Voting options */}
        <div className="space-y-4">
          {proposal.options.map((option, index) => {
            const voteCount = votesPerOption[index] || 0;
            const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isWinningOption = !isActive && winningOptionIndex === index && totalVotes > 0;
            const isUserVote = userVoteOption === index;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={`font-medium ${isUserVote ? "text-primary" : ""} ${isWinningOption ? "text-green-500" : ""}`}>
                    {option} {isUserVote && "(Your vote)"}
                  </span>
                  <span className={`${isWinningOption ? "text-green-500 font-medium" : "text-muted-foreground"}`}>
                    {voteCount} ({percentage}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={percentage} className={`h-2 ${isWinningOption ? "bg-green-500/20" : ""} ${isUserVote ? "bg-primary/20" : ""}`} />
                  {isActive && !userVoted && isMember && (
                    <Button 
                      size="sm" 
                      variant={isUserVote ? "default" : "outline"}
                      className="h-7 px-2"
                      onClick={() => handleVote(index)}
                      disabled={userVoted || !currentUserPubkey || !isMember}
                    >
                      Vote
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Vote count summary */}
        <div className="mt-4 text-xs text-muted-foreground">
          {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        {isActive && !userVoted && currentUserPubkey && isMember && (
          <div className="w-full text-xs text-center text-muted-foreground">
            Click on a voting option to cast your vote
          </div>
        )}
        {isActive && !currentUserPubkey && (
          <div className="w-full text-xs text-center text-amber-500">
            You need to login to vote
          </div>
        )}
        {isActive && currentUserPubkey && !isMember && (
          <div className="w-full text-xs text-center text-amber-500">
            You need to join this DAO to vote
          </div>
        )}
        {userVoted && (
          <div className="w-full text-xs text-center text-green-500">
            You have already voted
          </div>
        )}
        {!isActive && (
          <div className="w-full text-xs text-center text-muted-foreground">
            Voting has ended
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default DAOProposalCard;
