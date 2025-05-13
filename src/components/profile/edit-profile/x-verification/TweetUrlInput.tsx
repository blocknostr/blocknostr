
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';

interface TweetUrlInputProps {
  form: UseFormReturn<ProfileFormValues>;
  isVerifying: boolean;
  onVerify: () => void;
}

const TweetUrlInput = ({ 
  form, 
  isVerifying, 
  onVerify 
}: TweetUrlInputProps) => {
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-1">
        <label htmlFor="tweetUrl" className="text-sm font-medium">
          Tweet URL
        </label>
        <div className="flex space-x-2">
          <Input
            id="tweetUrl"
            placeholder="https://x.com/yourusername/status/123456789"
            {...form.register('tweetUrl')}
            className="flex-1"
          />
          <Button 
            onClick={onVerify} 
            disabled={isVerifying}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Paste the URL of your verification tweet to complete verification
      </p>
    </div>
  );
};

export default TweetUrlInput;
