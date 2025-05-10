
import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { nostrService } from "@/lib/nostr";
import VotersList from "@/components/VotersList";
import DiscordStyleChat from "./DiscordStyleChat";

export interface Proposal {
  id: string;
  communityId: string;
  title: string;
  description: string;
  options: string[];
  createdAt: number;
  endsAt: number;
  creator: string;
  votes: Record<string, number>;
}

interface ProposalCardProps {
  proposal: Proposal;
  communityId: string;
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  expandedProposal: string | null;
  setExpandedProposal: (id: string | null) => void;
}

const ProposalCard = ({
  proposal,
  communityId,
  isMember,
  isCreator,
  currentUserPubkey,
  expandedProposal,
  setExpandedProposal
}: ProposalCardProps) => {
  const isExpanded = expandedProposal === proposal.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Utility functions
  const getVoteCounts = () => {
    const counts = proposal.options.map(() => 0);
    
    Object.entries(proposal.votes).forEach(([_, optionIndex]) => {
      const index = typeof optionIndex === 'number' ? optionIndex : parseInt(optionIndex as string);
      if (index >= 0 && index < counts.length) {
        counts[index]++;
      }
    });
    
    return counts;
  };
  
  const getTotalVotes = () => {
    return Object.keys(proposal.votes).length;
  };
  
  const getUserVote = () => {
    if (!currentUserPubkey) return -1;
    const vote = proposal.votes[currentUserPubkey];
    return vote !== undefined ? Number(vote) : -1;
  };
  
  const getAllVoters = () => {
    return Object.keys(proposal.votes);
  };
  
  const isProposalActive = () => {
    return proposal.endsAt > Math.floor(Date.now() / 1000);
  };
  
  const [timeLeft, setTimeLeft] = useState<string>(() => {
    const now = Math.floor(Date.now() / 1000);
    if (proposal.endsAt > now) {
      return formatDistanceToNow(new Date(proposal.endsAt * 1000), { addSuffix: true });
    }
    return "Ended";
  });
  
  // Update time left every minute
  React.useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      if (proposal.endsAt > now) {
        setTimeLeft(formatDistanceToNow(new Date(proposal.endsAt * 1000), { addSuffix: true }));
      } else {
        setTimeLeft("Ended");
      }
    };
    
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [proposal.endsAt]);
  
  const handleVote = async (optionIndex: number) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to vote");
      return;
    }
    
    if (!isMember && !isCreator) {
      toast.error("You must be a member of this community to vote");
      return;
    }
    
    // Check if user already voted for this option
    if (getUserVote() === optionIndex) {
      toast.info("You already voted for this option");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await nostrService.voteOnProposal(proposal.id, optionIndex);
      toast.success("Vote recorded!");
      
      // Update local state to show vote immediately
      proposal.votes[currentUserPubkey] = optionIndex;
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate values
  const voteCounts = getVoteCounts();
  const totalVotes = getTotalVotes();
  const userVote = getUserVote();
  const isActive = isProposalActive();
  const allVoters = getAllVoters();
  
  return (
    <Card key={proposal.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{proposal.title}</CardTitle>
          <div className={isActive ? "text-green-500 flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
            {isActive ? (
              <>
                <Clock className="h-4 w-4" />
                {timeLeft}
              </>
            ) : (
              <>
                <Clock className="h-4 w-4" />
                Ended
              </>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center text-sm text-muted-foreground">
            <span>{totalVotes} votes</span>
            {userVote !== -1 && (
              <>
                <span className="mx-1">•</span>
                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Voted
                </span>
              </>
            )}
          </div>
          
          {/* Show voters avatars */}
          <VotersList voters={allVoters} maxDisplay={5} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">{proposal.description}</p>
        
        <div className="space-y-3">
          {proposal.options.map((option, index) => {
            const voteCount = voteCounts[index];
            const votePercentage = totalVotes > 0 
              ? Math.round((voteCount / totalVotes) * 100) 
              : 0;
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{option}</span>
                  <span className="text-sm text-muted-foreground">
                    {voteCount} ({votePercentage}%)
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${userVote === index ? 'bg-primary' : 'bg-primary/60'}`} 
                    style={{ width: `${votePercentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex-wrap items-start">
        <div className="w-full">
          {isActive && currentUserPubkey && (isMember || isCreator) && userVote === -1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {proposal.options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleVote(index)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Voting..." : option}
                </Button>
              ))}
            </div>
          )}
          {isActive && userVote !== -1 && (
            <div className="mb-4 text-sm">
              <span className="text-primary font-medium">You voted for: </span>
              {proposal.options[userVote]}
            </div>
          )}
          {!isActive && (
            <div className="mb-4 text-sm text-muted-foreground">
              This proposal is closed
            </div>
          )}
          {isActive && currentUserPubkey && !isMember && !isCreator && (
            <div className="mb-4 text-sm text-muted-foreground">
              Join the community to vote
            </div>
          )}
          
          {/* Chat section toggle */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedProposal(isExpanded ? null : proposal.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Discussion
            </Button>
          </div>
          
          {/* Discord-style chat section - increased width and padding for better nesting */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t w-full max-h-[600px] overflow-hidden rounded-md border">
              <DiscordStyleChat 
                proposalId={proposal.id} 
                communityId={communityId}
                currentUserPubkey={currentUserPubkey}
              />
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProposalCard;
