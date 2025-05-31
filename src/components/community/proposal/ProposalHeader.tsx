
import React from "react";
import { CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import VotersList from "@/components/VotersList";

interface ProposalHeaderProps {
  title: string;
  endsAt: number;
  userVote: number;
  totalVotes: number;
  allVoters: string[];
}

const ProposalHeader = ({ 
  title, 
  endsAt, 
  userVote, 
  totalVotes, 
  allVoters 
}: ProposalHeaderProps) => {
  const [timeLeft, setTimeLeft] = React.useState<string>(() => {
    const now = Math.floor(Date.now() / 1000);
    if (endsAt > now) {
      return formatDistanceToNow(new Date(endsAt * 1000), { addSuffix: true });
    }
    return "Ended";
  });
  
  const isActive = endsAt > Math.floor(Date.now() / 1000);
  
  // Update time left every minute
  React.useEffect(() => {
    const updateCountdown = () => {
      const now = Math.floor(Date.now() / 1000);
      if (endsAt > now) {
        setTimeLeft(formatDistanceToNow(new Date(endsAt * 1000), { addSuffix: true }));
      } else {
        setTimeLeft("Ended");
      }
    };
    
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [endsAt]);
  
  return (
    <>
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg">{title}</CardTitle>
        <div className={isActive ? "text-green-500 flex items-center gap-1" : "text-red-500 flex items-center gap-1"}>
          <Clock className="h-4 w-4" />
          {timeLeft}
        </div>
      </div>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center text-sm text-muted-foreground">
          <span>{totalVotes} votes</span>
          {userVote !== -1 && (
            <>
              <span className="mx-1">•</span>
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1"><path d="M20 6 9 17l-5-5"/></svg>
                Voted
              </span>
            </>
          )}
        </div>
        
        {/* Show voters avatars */}
        <VotersList voters={allVoters} maxDisplay={5} />
      </div>
    </>
  );
};

export default ProposalHeader;

