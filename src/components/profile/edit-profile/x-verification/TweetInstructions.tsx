
import { AlertCircle } from 'lucide-react';

interface TweetInstructionsProps {
  step: 'tweet' | 'verify';
}

const TweetInstructions = ({ step }: TweetInstructionsProps) => {
  if (step === 'tweet') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <p className="font-semibold flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          Step 1: Post Verification Tweet
        </p>
        <p className="mt-2">
          A new window should open for you to post a verification tweet. 
          The tweet must contain your Nostr public key exactly as shown.
        </p>
        <p className="mt-2">
          This follows the NIP-39 standard for external identity verification.
        </p>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
        <p className="font-semibold flex items-center gap-1">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          Step 2: Paste Tweet URL
        </p>
        <p className="mt-2">
          After posting, copy the URL of your verification tweet and paste it below.
        </p>
      </div>
    );
  }

  return null;
};

export default TweetInstructions;
