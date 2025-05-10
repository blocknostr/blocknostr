
import { useState } from 'react';
import { Twitter } from 'lucide-react';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { initiateXVerification, extractTweetId, verifyTweet } from '@/lib/nostr/xVerification';
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from '../types';

// Import refactored components
import XVerificationTooltip from './XVerificationTooltip';
import TwitterUsernameInput from './TwitterUsernameInput';
import InitiateVerificationButton from './InitiateVerificationButton';
import TweetInstructions from './TweetInstructions';
import TweetUrlInput from './TweetUrlInput';
import VerificationSuccess from './VerificationSuccess';

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
        <XVerificationTooltip />
      </div>
      
      <div className="space-y-4">
        {/* Twitter username input field */}
        <TwitterUsernameInput form={form} twitterVerified={twitterVerified} />
        
        {/* Verification initiation button - only shown when not verified and in idle state */}
        {!twitterVerified && verificationStep === 'idle' && (
          <InitiateVerificationButton 
            isVerifying={isVerifying}
            onClick={handleInitiateVerification}
          />
        )}
        
        {/* Instructions for the current verification step */}
        {(verificationStep === 'tweet' || verificationStep === 'verify') && (
          <TweetInstructions step={verificationStep} />
        )}
        
        {/* Tweet URL input field - only shown in verify step */}
        {verificationStep === 'verify' && (
          <TweetUrlInput 
            form={form} 
            isVerifying={isVerifying} 
            onVerify={handleVerifyTweet} 
          />
        )}
        
        {/* Success message - only shown when verified */}
        {twitterVerified && (
          <VerificationSuccess username={form.getValues('twitter')} />
        )}
      </div>
    </div>
  );
};

export default XVerificationSection;
