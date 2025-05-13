
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';

interface TweetUrlInputProps {
  form: UseFormReturn<ProfileFormValues>;
  isVerifying: boolean;
  onVerify: () => void;
}

const TweetUrlInput = ({ form, isVerifying, onVerify }: TweetUrlInputProps) => {
  return (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name="tweetUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Tweet URL</FormLabel>
            <FormControl>
              <Input
                placeholder="https://twitter.com/username/status/123456789"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <Button
        type="button"
        onClick={onVerify}
        disabled={isVerifying || !form.getValues('tweetUrl')}
        className="mt-2 w-full"
      >
        {isVerifying ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify Tweet"
        )}
      </Button>
    </div>
  );
};

export default TweetUrlInput;
