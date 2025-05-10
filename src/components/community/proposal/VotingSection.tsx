
import React from "react";
import { Button } from "@/components/ui/button";

interface VotingSectionProps {
  isActive: boolean;
  userVote: number;
  options: string[];
  isSubmitting: boolean;
  isMember: boolean;
  isCreator: boolean;
  currentUserPubkey: string | null;
  selectedOption: string | null;
  handleVote: (optionIndex: number) => Promise<void>;
}

const VotingSection = ({ 
  isActive,
  userVote,
  options,
  isSubmitting, 
  isMember,
  isCreator,
  currentUserPubkey,
  selectedOption,
  handleVote
}: VotingSectionProps) => {
  return (
    <div className="w-full">
      {isActive && currentUserPubkey && (isMember || isCreator) && userVote === -1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {options.map((option, index) => (
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
          {selectedOption}
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
    </div>
  );
};

export default VotingSection;
