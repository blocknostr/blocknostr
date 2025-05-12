
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Loader2, Info } from 'lucide-react';
import { ProfileFormValues } from './useProfileForm';
import { formatNip05 } from '@/lib/nostr/utils/nip/nip05';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const formattedNip05 = nip05Value ? formatNip05(nip05Value) : null;

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Add identity verification to your profile
        </h3>
      </div>

      <FormField
        control={form.control}
        name="nip05"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <span className="flex items-center gap-1">
                NIP-05 Identifier
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-80">
                      <p>NIP-05 links your Nostr public key to a human-readable identifier (similar to an email address).</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input 
                  placeholder="you@example.com" 
                  {...field} 
                  className={isNip05Verified === true ? "pr-8 border-green-500/50" : "pr-8"} 
                />
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
            <FormDescription>
              Provides human-readable verification for your profile
            </FormDescription>
            {isNip05Verified === false && nip05Value && (
              <Alert variant="warning" className="py-2 mt-2">
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
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input 
                  placeholder="username (without @)" 
                  {...field} 
                  value={field.value?.replace('@', '') || ''} 
                  className="pl-8" 
                />
              </div>
            </FormControl>
            <FormDescription>
              Your Twitter/X username
            </FormDescription>
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
    </div>
  );
};

export default SocialIdentityTab;
