
import React from 'react';
import { Check } from "lucide-react";

interface TweetInstructionsProps {
  step: 'tweet' | 'verify';
}

const TweetInstructions = ({ step }: TweetInstructionsProps) => {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-center">
        {step === 'tweet' 
          ? 'Step 1: Post a verification tweet' 
          : 'Step 2: Verify your tweet'}
      </h4>
      
      <div className="bg-muted p-2 rounded-md text-xs space-y-2">
        {step === 'tweet' ? (
          <>
            <p>1. A tweet composer will open in a new tab</p>
            <p>2. Post the tweet without modifying its content</p>
            <p>3. Return to this page after posting</p>
            <p>4. Copy the URL of your tweet</p>
          </>
        ) : (
          <>
            <p>1. Copy the URL of your verification tweet</p>
            <p>2. Paste it in the field below</p>
            <p>3. Click "Verify" to complete the process</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TweetInstructions;
