
import { FormField, FormItem, FormControl, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CheckCircle2 } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';

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
          <div className="flex items-center gap-2">
            <FormDescription>Username</FormDescription>
            {twitterVerified && (
              <span className="flex items-center text-xs gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <FormControl>
            <div className="relative">
              <Input
                value={field.value}
                onChange={field.onChange}
                placeholder="@username"
                className="pl-8"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: '10px center',
                  paddingLeft: '2rem'
                }}
              />
            </div>
          </FormControl>
          <FormDescription>
            Enter your X (Twitter) username with or without the @ symbol
          </FormDescription>
        </FormItem>
      )}
    />
  );
};

export default TwitterUsernameInput;
