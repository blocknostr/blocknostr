
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
import { publishProfileWithFallback, sanitizeImageUrl } from '@/components/you/profile/profileUtils';
import { UnsignedEvent } from 'nostr-tools';

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
      
      // Process image URLs to fix any relative paths
      if (values.picture) {
        values.picture = sanitizeImageUrl(values.picture);
        console.log("[PROFILE EDITOR] Sanitized picture URL:", values.picture);
      }
      
      if (values.banner) {
        values.banner = sanitizeImageUrl(values.banner);
        console.log("[PROFILE EDITOR] Sanitized banner URL:", values.banner);
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
        twitter: values.twitter ? values.twitter.replace('@', '') : '' // Remove @ if present
      };
      
      console.log("[PROFILE EDITOR] Prepared metadata:", metadata);
      
      // Create the event object to publish - fix the type by making required properties explicit
      const eventToPublish: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      console.log("[PROFILE EDITOR] Event to publish:", eventToPublish);
      
      // Get relay URLs for potential fallback publishing
      const relayUrls = connectedRelays.map(r => r.url);
      
      // Use our enhanced publishing function with fallbacks
      const { success, error } = await publishProfileWithFallback(eventToPublish, relayUrls);
      
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
        // Display specific error if available
        console.error("[PROFILE EDITOR] Profile update failed:", error);
        
        if (error?.includes("authorization") || error?.includes("Unauthorized")) {
          toast.error("Your Nostr extension doesn't match your current identity. Try disconnecting and reconnecting.", {
            duration: 6000
          });
        } else if (error?.includes("proof-of-work") || error?.includes("pow:")) {
          toast.error("This relay requires proof-of-work which is not supported. Try connecting to different relays.");
        } else {
          toast.error(error || "Failed to update profile");
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
