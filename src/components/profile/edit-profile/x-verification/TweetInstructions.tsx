
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface TweetInstructionsProps {
  step: 'idle' | 'tweet' | 'verify';
}

const TweetInstructions = ({ step }: TweetInstructionsProps) => {
  return (
    <Alert variant="default" className="bg-muted/50">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {step === 'tweet' && "Click the tweet button that opens in a new tab and post the verification tweet."}
        {step === 'verify' && "After posting your tweet, paste the URL of your tweet below to complete verification."}
      </AlertDescription>
    </Alert>
  );
};

export default TweetInstructions;
