
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField, FormItem, FormControl, FormDescription } from "@/components/ui/form";
import { Twitter, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { initiateXVerification, extractTweetId, verifyTweet } from '@/lib/nostr/xVerification';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from './types';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpCircle } from 'lucide-react';

interface XVerificationSectionProps {
  form: UseFormReturn<ProfileFormValues>;
  twitterVerified: boolean;
  setTwitterVerified: (verified: boolean) => void;
  setTweetId: (tweetId: string | null) => void;
  setXUsername: (username: string | null) => void;
}

const XVerificationSection = ({ 
  form, 
  twitterVerified, 
  setTwitterVerified, 
  setTweetId, 
  setXUsername 
}: XVerificationSectionProps) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'tweet' | 'verify'>('idle');

  const handleInitiateVerification = async () => {
    setVerificationStep('tweet');
    setIsVerifying(true);
    
    const twitterHandle = form.getValues('twitter').replace('@', '');
    if (!twitterHandle) {
      toast.error("Please enter your X (Twitter) username first");
      setIsVerifying(false);
      return;
    }
    
    // Get current user's npub
    const currentUserPubkey = nostrService.publicKey;
    if (!currentUserPubkey) {
      toast.error("You must be logged in to verify your X account");
      setIsVerifying(false);
      return;
    }
    
    const npub = nostrService.formatPubkey(currentUserPubkey);
    
    try {
      // Open Twitter intent to tweet with NIP-39 format
      await initiateXVerification(npub);
      setVerificationStep('verify');
    } catch (error) {
      console.error("Error initiating verification:", error);
      toast.error("Failed to initiate X verification");
      setIsVerifying(false);
      setVerificationStep('idle');
    }
  };
  
  const handleVerifyTweet = async () => {
    const tweetUrl = form.getValues('tweetUrl');
    if (!tweetUrl) {
      toast.error("Please enter the URL of your verification tweet");
      return;
    }
    
    // Save tweet URL to localStorage for simulation purposes
    localStorage.setItem('last_tweet_url', tweetUrl);
    
    const extractedTweetId = extractTweetId(tweetUrl);
    if (!extractedTweetId) {
      toast.error("Invalid tweet URL. Please ensure it's a full X/Twitter status URL");
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // Get current user's npub
      const currentUserPubkey = nostrService.publicKey;
      const npub = nostrService.formatPubkey(currentUserPubkey || '');
      
      // Verify the tweet according to NIP-39
      const { success, username } = await verifyTweet(extractedTweetId, npub);
      
      if (success && username) {
        setTwitterVerified(true);
        setTweetId(extractedTweetId);
        setXUsername(username);
        form.setValue('twitter', username);
        toast.success("X account verified successfully!");
      } else {
        toast.error("X account verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Error verifying tweet:", error);
      toast.error("Failed to verify X account");
    } finally {
      setIsVerifying(false);
      setVerificationStep('idle');
    }
  };

  return (
    <div className="space-y-2 border border-gray-200 rounded-md p-4 bg-gray-50">
      <div className="flex items-center gap-2 mb-2">
        <Twitter className="h-5 w-5 text-blue-500" />
        <h3 className="font-medium">X (Twitter) Account</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Verification follows NIP-39 standard for external identity verification.</p>
              <p className="mt-2">You'll post a tweet containing your Nostr public key, and we'll add an "i" tag to your profile metadata.</p>
              <p className="mt-2">The format is: ["i", "twitter:username", "tweetId"]</p>
              <a 
                href="https://github.com/nostr-protocol/nips/blob/master/39.md" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline mt-2 block"
              >
                Learn more about NIP-39
              </a>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-4">
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
        
        {!twitterVerified && verificationStep === 'idle' && (
          <Button 
            type="button"
            variant="outline"
            onClick={handleInitiateVerification}
            className="w-full flex items-center gap-2"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <><Twitter className="h-4 w-4" /> Verify X Account</>
            )}
          </Button>
        )}
        
        {verificationStep === 'tweet' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="font-semibold flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              Step 1: Post Verification Tweet
            </p>
            <p className="mt-2">
              A new window should open for you to post a verification tweet. 
              The tweet must contain your Nostr public key exactly as shown.
            </p>
            <p className="mt-2">
              This follows the NIP-39 standard for external identity verification.
            </p>
          </div>
        )}
        
        {verificationStep === 'verify' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
              <p className="font-semibold flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                Step 2: Paste Tweet URL
              </p>
              <p className="mt-2">
                After posting, copy the URL of your verification tweet and paste it below.
              </p>
            </div>
            
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
                        onClick={handleVerifyTweet}
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
          </div>
        )}
        
        {twitterVerified && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              X account verified successfully (NIP-39)
            </span>
            <a 
              href={`https://x.com/${form.getValues('twitter').replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1 text-xs"
            >
              View profile <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default XVerificationSection;
