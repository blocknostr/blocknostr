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
  const [retryCount, setRetryCount] = useState(0);

  const connectWithRetries = async (maxRetries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[PROFILE EDITOR] Attempt ${attempt} to connect to relays...`);
      try {
        await nostrService.connectToDefaultRelays();
        const relays = nostrService.getRelayStatus();
        const connectedRelays = relays.filter(r => r.status === 'connected');
        if (connectedRelays.length > 0) {
          console.log(`[PROFILE EDITOR] Connected to ${connectedRelays.length} relays:`, connectedRelays.map(r => r.url));
          return connectedRelays;
        }
        console.log(`[PROFILE EDITOR] No relays connected on attempt ${attempt}`);
      } catch (error) {
        console.error(`[PROFILE EDITOR] Relay connection attempt ${attempt} failed:`, error);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    throw new Error("Failed to connect to any relays after multiple attempts");
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      console.log("[PROFILE EDITOR] Starting profile update with values:", values);

      // Check and connect to relays
      let connectedRelays;
      try {
        connectedRelays = await connectWithRetries();
      } catch (error) {
        console.error("[PROFILE EDITOR] Relay connection failed:", error);
        toast.error("Cannot connect to relays. Please check your network and try again.");
        return;
      }

      // Sanitize image URLs
      if (values.picture) {
        values.picture = sanitizeImageUrl(values.picture);
        console.log("[PROFILE EDITOR] Sanitized picture URL:", values.picture);
      }
      if (values.banner) {
        values.banner = sanitizeImageUrl(values.banner);
        console.log("[PROFILE EDITOR] Sanitized banner URL:", values.banner);
      }

      // Prepare metadata
      const metadata: NostrProfileMetadata = {
        name: values.name,
        display_name: values.display_name,
        about: values.about,
        picture: values.picture,
        banner: values.banner,
        website: values.website,
        nip05: values.nip05,
        twitter: values.twitter ? values.twitter.replace('@', '') : ''
      };

      console.log("[PROFILE EDITOR] Prepared metadata:", metadata);

      // Create event
      const eventToPublish: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };

      console.log("[PROFILE EDITOR] Event to publish:", eventToPublish);

      // Get relay URLs
      let relayUrls = connectedRelays.map(r => r.url);
      if (relayUrls.length < 3) {
        const additionalRelays = [
          "wss://relay.damus.io",
          "wss://nos.lol",
          "wss://relay.snort.social"
        ];
        for (const url of additionalRelays) {
          if (!relayUrls.includes(url)) {
            relayUrls.push(url);
          }
        }
      }

      // Publish with fallback
      const publishResult = await publishProfileWithFallback(eventToPublish, relayUrls);

      if (publishResult.success) {
        toast.success(`Profile updated successfully on ${publishResult.successfulRelays.length} relay(s)`);
        if (nostrService.publicKey) {
          console.log("[PROFILE EDITOR] Broadcasting profilePublished event with eventId:", publishResult.eventId);
          window.dispatchEvent(new CustomEvent('profilePublished', { 
            detail: { 
              pubkey: nostrService.publicKey,
              eventId: publishResult.eventId
            } 
          }));
        }
        setRetryCount(0);
        onClose();
        onProfileUpdated();
      } else {
        console.error("[PROFILE EDITOR] Profile update failed:", publishResult);
        if (publishResult.error?.includes('authorization') || publishResult.error?.includes('Unauthorized')) {
          toast.error(
            "Authentication failed. Please ensure your Nostr extension is connected to the correct account and try again.",
            { duration: 8000 }
          );
        } else if (publishResult.error?.includes('proof-of-work') || publishResult.error?.includes('pow:')) {
          toast.error(
            "Some relays require proof-of-work, which is not supported. Retrying with other relays...",
            { duration: 5000 }
          );
          if (retryCount < 2) {
            setRetryCount(retryCount + 1);
            setTimeout(() => handleSubmit(values), 1500);
            return;
          }
        } else if (publishResult.error?.includes('no active subscription')) {
          toast.error(
            "Lost connection to relays. Attempting to reconnect...",
            { duration: 5000 }
          );
          if (retryCount < 2) {
            setRetryCount(retryCount + 1);
            setTimeout(() => handleSubmit(values), 1500);
            return;
          }
        } else {
          toast.error(
            publishResult.error || 
            `Failed to update profile. Details: ${publishResult.failedRelays.map(r => `${r.url}: ${r.error}`).join(', ')}`,
            { duration: 8000 }
          );
        }
      }
    } catch (error) {
      console.error("[PROFILE EDITOR] Error updating profile:", error);
      toast.error("An unexpected error occurred while updating profile", { duration: 8000 });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <ProfileBasicFields form={form} />
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