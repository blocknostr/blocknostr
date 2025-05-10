
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';

interface TweetUrlInputProps {
  form: UseFormReturn<ProfileFormValues>;
  isVerifying: boolean;
  onVerify: () => void;
}

const TweetUrlInput = ({ form, isVerifying, onVerify }: TweetUrlInputProps) => {
  return (
    <FormField
      control={form.control}
      name="tweetUrl"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <div className="flex gap-2">
              <Input 
                placeholder="https://x.com/username/status/123456789"
                {...field}
              />
              <Button 
                type="button" 
                onClick={onVerify}
                disabled={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : "Verify"}
              </Button>
            </div>
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default TweetUrlInput;
