
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema, ProfileFormValues } from './edit-profile/types';
import ProfileEditor from './edit-profile/ProfileEditor';

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
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile details and verify your social accounts
          </DialogDescription>
        </DialogHeader>
        
        <ProfileEditor
          form={form}
          isSubmitting={isSubmitting}
          twitterVerified={twitterVerified}
          setTwitterVerified={setTwitterVerified}
          setTweetId={setTweetId}
          setXUsername={setXUsername}
          onClose={() => onOpenChange(false)}
          onProfileUpdated={onProfileUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
