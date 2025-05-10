
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';
import { Loader2, HelpCircle, Twitter, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NostrProfileMetadata, NostrEvent } from '@/lib/nostr/types';
import { initiateXVerification, extractTweetId, extractUsername, verifyTweet } from '@/lib/nostr/xVerification';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: any;
  onProfileUpdated: () => void;
}

// Define form schema with validation
const formSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().url().optional().or(z.string().length(0)),
  banner: z.string().url().optional().or(z.string().length(0)),
  website: z.string().url().optional().or(z.string().length(0)),
  nip05: z.string().optional(),
  twitter: z.string().optional(),
  tweetUrl: z.string().optional()
});

const EditProfileDialog = ({ open, onOpenChange, profileData, onProfileUpdated }: EditProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'tweet' | 'verify'>('idle');
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [xUsername, setXUsername] = useState<string | null>(null);
  
  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      display_name: '',
      about: '',
      picture: '',
      banner: '',
      website: '',
      nip05: '',
      twitter: '',
      tweetUrl: ''
    }
  });
  
  // Load existing profile data when dialog opens
  useEffect(() => {
    if (profileData) {
      form.reset({
        name: profileData.name || '',
        display_name: profileData.display_name || '',
        about: profileData.about || '',
        picture: profileData.picture || '',
        banner: profileData.banner || '',
        website: profileData.website || '',
        nip05: profileData.nip05 || '',
        twitter: profileData.twitter || '',
        tweetUrl: ''
      });
      
      // Check if Twitter is already verified
      setTwitterVerified(!!profileData.twitter_verified);
      if (profileData.twitter_proof) {
        setTweetId(profileData.twitter_proof);
      }
    }
  }, [profileData, open, form]);
  
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
  
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Prepare metadata object
      const metadata: NostrProfileMetadata = {
        name: values.name,
        display_name: values.display_name,
        about: values.about,
        picture: values.picture,
        banner: values.banner,
        website: values.website,
        nip05: values.nip05,
        twitter: values.twitter.replace('@', '') // Remove @ if present
      };
      
      // Add Twitter verification status if verified
      if (twitterVerified && tweetId && xUsername) {
        metadata.twitter_verified = true;
        metadata.twitter_proof = tweetId;
      }
      
      // Create the event object to publish
      const eventToPublish: Partial<NostrEvent> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      // Add NIP-39 i tag if Twitter is verified
      if (twitterVerified && tweetId && xUsername) {
        const cleanUsername = xUsername.replace('@', '');
        eventToPublish.tags = eventToPublish.tags || [];
        eventToPublish.tags.push(['i', `twitter:${cleanUsername}`, tweetId]);
      }
      
      // Publish metadata to Nostr network
      const success = await nostrService.publishEvent(eventToPublish);
      
      if (success) {
        toast.success("Profile updated successfully");
        onOpenChange(false);
        onProfileUpdated();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile details and verify your social accounts
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Display Name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="picture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/profile.jpg"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/banner.jpg"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
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

            {/* X (Twitter) Account Field with Verification */}
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
                      <p className="mt-2">You'll need to post a tweet containing your Nostr public key.</p>
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
                        <FormLabel>Username</FormLabel>
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
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
