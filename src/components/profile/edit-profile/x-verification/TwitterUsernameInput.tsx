
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';
import { Check } from "lucide-react";

interface TwitterUsernameInputProps {
  form: UseFormReturn<ProfileFormValues>;
  twitterVerified: boolean;
}

const TwitterUsernameInput = ({ form, twitterVerified }: TwitterUsernameInputProps) => {
  return (
    <FormField
      control={form.control}
      name="twitter"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            Username
            {twitterVerified && (
              <span className="text-green-500 flex items-center text-xs font-normal">
                <Check className="h-3 w-3 mr-1" />
                Verified
              </span>
            )}
          </FormLabel>
          <FormControl>
            <Input
              placeholder="@username"
              {...field}
              value={field.value}
              onChange={(e) => {
                // Remove @ if it's already in the input
                const value = e.target.value.startsWith('@')
                  ? e.target.value
                  : `@${e.target.value}`;
                field.onChange(value);
              }}
              disabled={twitterVerified}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
};

export default TwitterUsernameInput;
