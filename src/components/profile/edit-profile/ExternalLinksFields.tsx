
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ProfileFormValues } from './types';

interface ExternalLinksFieldsProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ExternalLinksFields = ({ form }: ExternalLinksFieldsProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">External Links & Verification</h3>
        <p className="text-sm text-muted-foreground">
          Connect your external accounts and verify your identity.
        </p>
      </div>
      
      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website</FormLabel>
            <FormControl>
              <Input placeholder="https://yourwebsite.com" {...field} />
            </FormControl>
            <FormDescription>
              Your personal website or blog
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="nip05"
        render={({ field }) => (
          <FormItem>
            <FormLabel>NIP-05 Identifier</FormLabel>
            <FormControl>
              <Input placeholder="you@example.com" {...field} />
            </FormControl>
            <FormDescription>
              Your NIP-05 identifier for verification (e.g. name@domain.com)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="twitter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Twitter Username</FormLabel>
            <FormControl>
              <Input placeholder="username" {...field} />
            </FormControl>
            <FormDescription>
              Your Twitter username (without @)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default ExternalLinksFields;
