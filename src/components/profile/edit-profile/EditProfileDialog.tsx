
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileFormSchema, ProfileFormValues } from './types';
import ProfileEditor from './ProfileEditor';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: any;
  onProfileUpdated: () => void;
}

const EditProfileDialog = ({ open, onOpenChange, profileData, onProfileUpdated }: EditProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      twitter: ''
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
        twitter: profileData.twitter || ''
      });
      
      // Check if Twitter is already verified via NIP-39 "i" tag
      if (Array.isArray(profileData.tags)) {
        const twitterTag = profileData.tags.find(tag => 
          tag.length >= 3 && tag[0] === 'i' && tag[1].startsWith('twitter:')
        );
        
        if (twitterTag) {
          const username = twitterTag[1].split(':')[1]; // Extract username from "twitter:username"
          form.setValue('twitter', username);
        } else if (profileData.twitter) {
          form.setValue('twitter', profileData.twitter);
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
          onClose={() => onOpenChange(false)}
          onProfileUpdated={onProfileUpdated}
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
