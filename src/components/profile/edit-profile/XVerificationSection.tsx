
import { useState } from 'react';
import { Twitter } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from './types';
import { nostrService } from '@/lib/nostr';
import { initiateXVerification, extractTweetId, verifyTweet } from '@/lib/nostr/xVerification';
import { toast } from 'sonner';

import XVerificationTooltip from './x-verification/XVerificationTooltip';
import TwitterUsernameInput from './x-verification/TwitterUsernameInput';
import InitiateVerificationButton from './x-verification/InitiateVerificationButton';
import TweetInstructions from './x-verification/TweetInstructions';
import TweetUrlInput from './x-verification/TweetUrlInput';
import VerificationSuccess from './x-verification/VerificationSuccess';

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
    <div className="space-y-2 border border-gray-300 rounded-md p-4 bg-gray-100 dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <Twitter className="h-5 w-5 text-[#1DA1F2]" />
        <h3 className="font-medium text-gray-800 dark:text-gray-200">X (Twitter) Account</h3>
        <XVerificationTooltip />
      </div>
      
      <div className="space-y-4">
        <TwitterUsernameInput form={form} twitterVerified={twitterVerified} />
        
        {!twitterVerified && verificationStep === 'idle' && (
          <InitiateVerificationButton 
            isVerifying={isVerifying}
            onClick={handleInitiateVerification}
          />
        )}
        
        {(verificationStep === 'tweet' || verificationStep === 'verify') && (
          <TweetInstructions step={verificationStep} />
        )}
        
        {verificationStep === 'verify' && (
          <TweetUrlInput 
            form={form} 
            isVerifying={isVerifying} 
            onVerify={handleVerifyTweet} 
          />
        )}
        
        {twitterVerified && (
          <VerificationSuccess username={form.getValues('twitter')} />
        )}
      </div>
    </div>
  );
};

export default XVerificationSection;
