
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from './types';
import { HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ExternalLinksFieldsProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ExternalLinksFields = ({ form }: ExternalLinksFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Website</FormLabel>
            <FormControl>
              <Input
                placeholder="https://yourwebsite.com"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="nip05"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>NIP-05 Identifier</FormLabel>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>NIP-05 identifiers provide verification of your identity.</p>
                    <p className="mt-2">Format: you@yourdomain.com</p>
                    <p className="mt-2">You need to set up a <code>.well-known/nostr.json</code> file on your domain to link your identifier to your public key.</p>
                    <a 
                      href="https://github.com/nostr-protocol/nips/blob/master/05.md" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline mt-2 block"
                    >
                      Learn more about NIP-05
                    </a>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <FormControl>
              <Input
                placeholder="you@example.com"
                {...field}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
};

export default ExternalLinksFields;
