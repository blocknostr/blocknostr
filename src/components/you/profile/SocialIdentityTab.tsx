
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { ProfileFormValues } from './useProfileForm';

interface SocialIdentityTabProps {
  form: UseFormReturn<ProfileFormValues>;
  isNip05Verified: boolean | null;
  isNip05Verifying: boolean;
}

const SocialIdentityTab: React.FC<SocialIdentityTabProps> = ({ 
  form, 
  isNip05Verified, 
  isNip05Verifying 
}) => {
  const nip05Value = form.watch('nip05');

  return (
    <>
      <FormField
        control={form.control}
        name="nip05"
        render={({ field }) => (
          <FormItem>
            <FormLabel>NIP-05 Identifier</FormLabel>
            <FormControl>
              <div className="relative">
                <Input placeholder="you@example.com" {...field} />
                {nip05Value && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {isNip05Verifying ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isNip05Verified === true ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : isNip05Verified === false ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : null}
                  </div>
                )}
              </div>
            </FormControl>
            {isNip05Verified === false && nip05Value && (
              <Alert variant="warning" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This NIP-05 identifier cannot be verified
                </AlertDescription>
              </Alert>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="twitter"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Twitter/X Username</FormLabel>
            <FormControl>
              <Input placeholder="username (without @)" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="github"
        render={({ field }) => (
          <FormItem>
            <FormLabel>GitHub Username</FormLabel>
            <FormControl>
              <Input placeholder="username" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="lud16"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lightning Address</FormLabel>
            <FormControl>
              <Input placeholder="your@lightning.address" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default SocialIdentityTab;
