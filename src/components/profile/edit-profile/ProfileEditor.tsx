
import { useState } from 'react';
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NostrProfileMetadata, NostrEvent } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from './types';

import ProfileBasicFields from './ProfileBasicFields';
import ExternalLinksFields from './ExternalLinksFields';

interface ProfileEditorProps {
  form: UseFormReturn<ProfileFormValues>;
  isSubmitting: boolean;
  onClose: () => void;
  onProfileUpdated: () => void;
}

const ProfileEditor = ({
  form,
  isSubmitting,
  onClose,
  onProfileUpdated
}: ProfileEditorProps) => {
  
  const handleSubmit = async (values: ProfileFormValues) => {
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
      
      // Publish metadata to Nostr network
      const success = await nostrService.publishEvent(eventToPublish);
      
      if (success) {
        toast.success("Profile updated successfully");
        onClose();
        onProfileUpdated();
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        {/* Basic profile fields */}
        <ProfileBasicFields form={form} />
        
        {/* External links fields */}
        <ExternalLinksFields form={form} />
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
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
  );
};

export default ProfileEditor;
