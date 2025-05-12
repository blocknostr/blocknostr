
import { useState } from 'react';
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { NostrProfileMetadata, NostrEvent } from '@/lib/nostr/types';
import { nostrService } from '@/lib/nostr';
import { Form } from "@/components/ui/form";
import { UseFormReturn } from 'react-hook-form';
import { ProfileFormValues } from './types';
import { publishProfileWithFallback, sanitizeImageUrl } from '@/components/you/profile/profileUtils';
import { UnsignedEvent } from 'nostr-tools';
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [publishError, setPublishError] = useState<string | null>(null);
  
  const handleSubmit = async (values: ProfileFormValues) => {
    try {
      setPublishError(null);
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
          
          // Verify we have connections
          if (!updatedRelays.some(r => r.status === 'connected')) {
            setPublishError("Unable to connect to relays. Try adding relays in the profile settings.");
            return;
          }
        } catch (connError) {
          console.error("[PROFILE EDITOR] Failed to connect to relays:", connError);
          setPublishError("Unable to connect to relays. Please check your connection and try again.");
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
      
      // Clean up empty values
      const cleanedValues: Record<string, any> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanedValues[key] = value;
        }
      });
      
      // Prepare metadata object
      const metadata: NostrProfileMetadata = cleanedValues;
      console.log("[PROFILE EDITOR] Prepared metadata:", metadata);
      
      // Create the event object to publish
      const eventToPublish: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'> = {
        kind: 0,
        content: JSON.stringify(metadata),
        tags: []
      };
      
      console.log("[PROFILE EDITOR] Event to publish:", eventToPublish);
      
      // Get relay URLs for potential fallback publishing
      const relayUrls = connectedRelays.map(r => r.url);
      
      // Add some known good non-POW relays if we don't have many connections
      if (relayUrls.length < 3) {
        const additionalRelays = [
          "wss://relay.damus.io",
          "wss://nos.lol",
          "wss://relay.snort.social",
          "wss://nostr.mom",
          "wss://relay.current.fyi"
        ];
        
        for (const url of additionalRelays) {
          if (!relayUrls.includes(url)) {
            relayUrls.push(url);
          }
        }
      }
      
      // Use our enhanced publishing function with fallbacks
      const publishResult = await publishProfileWithFallback(eventToPublish, relayUrls);
      
      if (publishResult.success) {
        toast.success("Profile updated successfully");
        setPublishError(null);
        
        // Trigger a custom event to notify components of the profile update
        if (nostrService.publicKey) {
          console.log("[PROFILE EDITOR] Broadcasting profilePublished event with eventId:", publishResult.eventId);
          window.dispatchEvent(new CustomEvent('profilePublished', { 
            detail: { 
              pubkey: nostrService.publicKey,
              eventId: publishResult.eventId
            } 
          }));
        }
        
        // Reset retry count on success
        setRetryCount(0);
        
        // Close dialog and refresh profile
        onClose();
        onProfileUpdated();
      } else {
        // Display specific error if available
        console.error("[PROFILE EDITOR] Profile update failed:", publishResult.error);
        setPublishError(publishResult.error || "Failed to update profile");
        
        if (publishResult.error?.includes("proof-of-work") || publishResult.error?.includes("pow:")) {
          // Increment retry count
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);
          
          // If we haven't tried too many times, attempt with different relays
          if (newRetryCount <= 2) {
            toast.loading("Trying alternative relays...");
            setTimeout(() => {
              handleSubmit(values);
            }, 1500);
            return;
          }
        } else if (publishResult.error?.includes("no active subscription")) {
          // Try reconnecting to relays and retry once
          try {
            await nostrService.connectToDefaultRelays();
            
            // Increment retry count
            const newRetryCount = retryCount + 1;
            setRetryCount(newRetryCount);
            
            // If we haven't tried too many times, retry
            if (newRetryCount <= 2) {
              setTimeout(() => {
                handleSubmit(values);
              }, 1500);
              return;
            }
          } catch (reconnectError) {
            console.error("[PROFILE EDITOR] Reconnection failed:", reconnectError);
            setPublishError("Failed to reconnect to relays. Try refreshing the page.");
          }
        }
      }
    } catch (error) {
      console.error("[PROFILE EDITOR] Error updating profile:", error);
      setPublishError("An unexpected error occurred while updating profile");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        {publishError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center">
              <span className="flex-1">{publishError}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPublishError(null)}
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
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
