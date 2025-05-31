
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';
import { nostrService } from '@/lib/nostr';
import { toast } from "@/lib/toast";

interface PollOption {
  id: string;
  text: string;
  count: number;
}

interface PollProps {
  eventId: string;
  options: PollOption[];
  endDate?: Date;
  voted?: string | null;
  totalVotes?: number;
  onVote?: (optionId: string) => Promise<boolean>;
  className?: string;
}

export const PollComponent: React.FC<PollProps> = ({
  eventId,
  options,
  endDate,
  voted: initialVoted = null,
  totalVotes: initialTotal = 0,
  onVote,
  className
}) => {
  const [voted, setVoted] = useState<string | null>(initialVoted);
  const [totalVotes, setTotalVotes] = useState(initialTotal);
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollEnded = endDate ? new Date() > endDate : false;
  const canVote = !voted && !pollEnded && nostrService.publicKey;
  
  // Calculate percentages for each option
  const calculatePercentage = (count: number): number => {
    if (totalVotes === 0) return 0;
    return (count / totalVotes) * 100;
  };
  
  // Handle voting
  const handleVote = async (optionId: string) => {
    if (!canVote) return;
    
    setIsVoting(true);
    setError(null);
    
    try {
      // If onVote handler is provided, use it
      if (onVote) {
        const success = await onVote(optionId);
        if (success) {
          setVoted(optionId);
          setTotalVotes(prev => prev + 1);
          toast.success("Vote recorded successfully");
        } else {
          throw new Error("Failed to record vote");
        }
      } else {
        // Otherwise use a default implementation
        // This would be replaced with actual Nostr event creation
        const success = await new Promise<boolean>(resolve => {
          setTimeout(() => resolve(true), 500);
        });
        
        if (success) {
          setVoted(optionId);
          setTotalVotes(prev => prev + 1);
          toast.success("Vote recorded successfully");
        } else {
          throw new Error("Failed to record vote");
        }
      }
    } catch (err) {
      console.error("Error voting:", err);
      setError("Failed to record vote. Please try again.");
      toast.error("Failed to record vote");
    } finally {
      setIsVoting(false);
    }
  };
  
  // Format time remaining
  const formatTimeRemaining = (): string => {
    if (!endDate) return "";
    
    const now = new Date();
    if (now > endDate) return "Poll ended";
    
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h remaining`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m remaining`;
    } else {
      return `${diffMinutes}m remaining`;
    }
  };
  
  return (
    <div className={cn("mt-3 p-3 border rounded-lg bg-muted/20", className)}>
      {error && (
        <div className="mb-3 p-2 bg-destructive/10 text-destructive text-sm rounded flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
      
      <div className="space-y-2">
        {options.map((option) => {
          const percentage = calculatePercentage(option.count);
          const isSelected = voted === option.id;
          
          return (
            <div key={option.id} className="relative">
              <Button
                variant={canVote ? "outline" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start h-auto py-3 mb-1 text-left",
                  isSelected && "border-primary/50 bg-primary/10"
                )}
                disabled={!canVote || isVoting}
                onClick={() => handleVote(option.id)}
              >
                <span className="flex-grow">{option.text}</span>
                {isSelected && (
                  <Check className="h-4 w-4 ml-2 text-primary" />
                )}
              </Button>
              
              {(voted || pollEnded) && (
                <div className="flex items-center mt-1 text-xs">
                  <Progress
                    value={percentage}
                    className={cn(
                      "h-1 flex-grow",
                      isSelected ? "bg-secondary [&>div]:bg-primary" : "bg-secondary [&>div]:bg-muted-foreground"
                    )}
                  />
                  <span className="ml-2 text-muted-foreground font-medium w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-xs text-muted-foreground">
        <div>{totalVotes} votes</div>
        {endDate && (
          <div>{formatTimeRemaining()}</div>
        )}
        {!nostrService.publicKey && !pollEnded && (
          <div className="text-right">Sign in to vote</div>
        )}
      </div>
    </div>
  );
};

export default PollComponent;

