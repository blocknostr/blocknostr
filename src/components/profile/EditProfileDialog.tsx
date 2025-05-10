
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NostrProfileMetadata, NostrEvent } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { Form } from "@/components/ui/form";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Import refactored components
import ProfileBasicFields from './edit-profile/ProfileBasicFields';
import ExternalLinksFields from './edit-profile/ExternalLinksFields';
import XVerificationSection from './edit-profile/XVerificationSection';
import { profileFormSchema, ProfileFormValues } from './edit-profile/types';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: any;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profileData, onProfileUpdated }: EditProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [twitterVerified, setTwitterVerified] = useState(false);
  const [tweetId, setTweetId] = useState<string | null>(null);
  const [xUsername, setXUsername] = useState<string | null>(null);
  
  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
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
      // Fill form with existing data
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
      
      // Check if Twitter is already verified via NIP-39 "i" tag
      if (Array.isArray(profileData.tags)) {
        const twitterTag = profileData.tags.find(tag => 
          tag.length >= 3 && tag[0] === 'i' && tag[1].startsWith('twitter:')
        );
        
        if (twitterTag) {
          setTwitterVerified(true);
          setTweetId(twitterTag[2]); // Tweet ID is in position 2
          const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
          setXUsername(username);
          form.setValue('twitter', username);
        } else if (profileData.twitter_verified) {
          // Legacy verification
          setTwitterVerified(!!profileData.twitter_verified);
          if (profileData.twitter_proof) {
            setTweetId(profileData.twitter_proof);
          }
        }
      }
    }
  }, [profileData, open, form]);
  
  const handleSubmit = async (values: ProfileFormValues) => {
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
      
      // Create the event object to publish
      const eventToPublish: Partial<NostrEvent> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      // Add NIP-39 "i" tag for Twitter verification if verified
      if (twitterVerified && tweetId && xUsername) {
        const cleanUsername = xUsername.replace('@', '');
        eventToPublish.tags = [
          // NIP-39 compliant format: ["i", "twitter:username", "tweetId"]
          ["i", `twitter:${cleanUsername}`, tweetId]
        ];
      }
      
      // Publish metadata to Nostr network
      const success = await nostrService.publishEvent(eventToPublish);
      
      if (success) {
        // Create a new updated profile object that combines the old data with new values
        const updatedProfile = {
          ...profileData,
          ...metadata,
          tags: eventToPublish.tags // Include the updated tags
        };
        
        toast.success("Profile updated successfully");
        onOpenChange(false);
        
        // Call the callback with the updated profile data
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
            {/* Basic profile fields */}
            <ProfileBasicFields form={form} />
            
            {/* External links fields */}
            <ExternalLinksFields form={form} />

            {/* X (Twitter) Account Verification */}
            <XVerificationSection 
              form={form}
              twitterVerified={twitterVerified}
              setTwitterVerified={setTwitterVerified}
              setTweetId={setTweetId}
              setXUsername={setXUsername}
            />
            
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
