
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
      console.log("[PROFILE EDITOR] Starting profile update with values:", values);
      
      // Check relay connections first
      const relays = nostrService.getRelayStatus();
      console.log("[PROFILE EDITOR] Current relay status:", relays);
      const connectedRelays = relays.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.log("[PROFILE EDITOR] No connected relays found, connecting to default relays...");
        try {
          await nostrService.connectToDefaultRelays();
          // Check connection status after attempt
          const updatedRelays = nostrService.getRelayStatus();
          console.log("[PROFILE EDITOR] Relay status after connection attempt:", updatedRelays);
        } catch (connError) {
          console.error("[PROFILE EDITOR] Failed to connect to relays:", connError);
          toast.error("Unable to connect to relays. Please check your connection and try again.");
          return;
        }
      } else {
        console.log("[PROFILE EDITOR] Connected relays:", connectedRelays.map(r => r.url));
      }
      
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
      
      console.log("[PROFILE EDITOR] Prepared metadata:", metadata);
      
      // Create the event object to publish
      const eventToPublish: Partial<NostrEvent> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      console.log("[PROFILE EDITOR] Event to publish:", eventToPublish);
      
      try {
        // Publish metadata to Nostr network
        console.log("[PROFILE EDITOR] Publishing event to Nostr network...");
        const success = await nostrService.publishEvent(eventToPublish);
        console.log("[PROFILE EDITOR] Publish result:", success ? "Success" : "Failed");
        
        if (success) {
          toast.success("Profile updated successfully");
          // Wait briefly for relays to process the update
          console.log("[PROFILE EDITOR] Waiting for relay propagation before refreshing...");
          setTimeout(() => {
            console.log("[PROFILE EDITOR] Calling onClose() and onProfileUpdated()");
            onClose();
            onProfileUpdated();
          }, 1500);
        } else {
          console.error("[PROFILE EDITOR] Profile update failed - no success response");
          toast.error("Failed to update profile");
        }
      } catch (publishError: any) {
        console.error("[PROFILE EDITOR] Error publishing profile:", publishError);
        
        // Handle specific error types
        if (publishError.message && publishError.message.includes('pow:')) {
          console.log("[PROFILE EDITOR] Detected POW requirement error");
          toast.error('This relay requires proof-of-work which is not yet supported. Try connecting to different relays.');
        } else if (publishError.message && publishError.message.includes('subscription')) {
          console.log("[PROFILE EDITOR] Detected subscription error");
          toast.error('Connection to relay was lost. Please try again.');
        } else if (publishError.message && publishError.message.includes('timeout')) {
          console.log("[PROFILE EDITOR] Detected timeout error");
          toast.error('Connection to relay timed out. Please try again.');
        } else {
          console.log("[PROFILE EDITOR] Unknown error type:", publishError.message);
          toast.error("An error occurred while updating profile");
        }
      }
    } catch (error) {
      console.error("[PROFILE EDITOR] Error updating profile:", error);
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
