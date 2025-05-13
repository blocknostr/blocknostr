
import React from 'react';
import { Input } from "@/components/ui/input";
import { Check } from "lucide-react";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';

interface TwitterUsernameInputProps {
  form: UseFormReturn<ProfileFormValues>;
  twitterVerified: boolean;
}

const TwitterUsernameInput = ({ 
  form, 
  twitterVerified 
}: TwitterUsernameInputProps) => {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex justify-between items-center">
        <label htmlFor="twitter" className="text-sm font-medium">
          X (Twitter) Username
        </label>
        {twitterVerified && (
          <div className="flex items-center text-xs text-green-600 dark:text-green-500">
            <Check className="h-3 w-3 mr-1" />
            Verified
          </div>
        )}
      </div>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          @
        </span>
        <Input
          id="twitter"
          placeholder="username"
          className="pl-7"
          disabled={twitterVerified}
          {...form.register('twitter')}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Your X (Twitter) username without the @ symbol
      </p>
    </div>
  );
};

export default TwitterUsernameInput;
