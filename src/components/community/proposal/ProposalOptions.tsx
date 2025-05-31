
import React from "react";

interface ProposalOptionsProps {
  options: string[];
  voteCounts: number[];
  totalVotes: number;
  userVote: number;
}

const ProposalOptions = ({ 
  options, 
  voteCounts, 
  totalVotes, 
  userVote 
}: ProposalOptionsProps) => {
  return (
    <div className="space-y-3">
      {options.map((option, index) => {
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
  );
};

export default ProposalOptions;

