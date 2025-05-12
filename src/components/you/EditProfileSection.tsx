import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nostrService } from '@/lib/nostr';
import { UnsignedEvent } from 'nostr-tools';

import BasicInfoTab from './profile/BasicInfoTab';
import AppearanceTab from './profile/AppearanceTab';
import SocialIdentityTab from './profile/SocialIdentityTab';
import { useProfileForm } from './profile/useProfileForm';
import {
  verifyNip05Identifier,
  forceRefreshProfile,
  sanitizeImageUrl,
  publishProfileWithFallback
} from './profile/profileUtils';

interface EditProfileSectionProps {
  profileData: any;
  onSaved: () => void;
}

const EditProfileSection: React.FC<EditProfileSectionProps> = ({
  profileData,
  onSaved,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { form, isNip05Verified, isNip05Verifying } = useProfileForm({ profileData });
  const [retryAttempt, setRetryAttempt] = useState(0);

  const connectWithRetries = async (maxRetries = 3, delay = 2000) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`[PROFILE UPDATE] Attempt ${attempt} to connect to relays...`);
      try {
        await nostrService.connectToDefaultRelays();
        const relays = nostrService.getRelayStatus();
        const connectedRelays = relays.filter(r => r.status === 'connected');
        if (connectedRelays.length > 0) {
          console.log(`[PROFILE UPDATE] Connected to ${connectedRelays.length} relays:`, connectedRelays.map(r => r.url));
          return connectedRelays;
        }
        console.log(`[PROFILE UPDATE] No relays connected on attempt ${attempt}`);
      } catch (error) {
        console.error(`[PROFILE UPDATE] Relay connection attempt ${attempt} failed:`, error);
      }
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    throw new Error("Failed to connect to any relays after multiple attempts");
  };

  const onSubmit = async (values: any) => {
    if (!nostrService.publicKey) {
      toast.error('You must be logged in to update your profile', { duration: 8000 });
      return;
    }

    setIsSubmitting(true);
    console.log('[PROFILE UPDATE] Starting profile update with values:', values);

    try {
      // Connect to relays
      let connectedRelays;
      try {
        connectedRelays = await connectWithRetries();
      } catch (error) {
        console.error('[PROFILE UPDATE] Relay connection failed:', error);
        toast.error('Cannot connect to relays. Please check your network and try again.', { duration: 8000 });
        setIsSubmitting(false);
        return;
      }

      // Sanitize image URLs
      if (values.picture) {
        values.picture = sanitizeImageUrl(values.picture);
      }
      if (values.banner) {
        values.banner = sanitizeImageUrl(values.banner);
      }

      console.log('[PROFILE UPDATE] Clean values payload:', values);

      // Verify NIP-05 if provided
      if (values.nip05) {
        console.log('[PROFILE UPDATE] Verifying NIP-05 identifier:', values.nip05);
        const verified = await verifyNip05Identifier(values.nip05);
        console.log('[PROFILE UPDATE] NIP-05 verification result:', verified);
        if (!verified) {
          toast.warning('NIP-05 identifier could not be verified, but will be saved', { duration: 5000 });
        }
      }

      // Build event
      const eventToPublish: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'> = {
        kind: 0,
        content: JSON.stringify(values),
        tags: [],
      };
      console.log('[PROFILE UPDATE] Event to publish:', eventToPublish);

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

      // Publish
      const publishResult = await publishProfileWithFallback(eventToPublish, relayUrls);

      if (publishResult.success) {
        toast.success(`Profile updated successfully on ${publishResult.successfulRelays.length} relay(s)`);
        if (nostrService.publicKey) {
          console.log('[PROFILE UPDATE] Broadcasting profilePublished event with eventId:', publishResult.eventId);
          window.dispatchEvent(new CustomEvent('profilePublished', { 
            detail: { 
              pubkey: nostrService.publicKey,
              eventId: publishResult.eventId
            } 
          }));
        }
        setRetryAttempt(0);
        if (nostrService.publicKey) {
          console.log('[PROFILE UPDATE] Forcing profile refresh after update');
          await forceRefreshProfile(nostrService.publicKey);
        }
        onSaved();
      } else {
        console.error('[PROFILE UPDATE] Profile update failed:', publishResult);
        if (publishResult.error?.includes('authorization') || publishResult.error?.includes('Unauthorized')) {
          toast.error(
            "Authentication failed. Please ensure your Nostr extension is connected to the correct account and try again.",
            { duration: 8000 }
          );
        } else if (publishResult.error?.includes('proof-of-work') || publishResult.error?.includes('pow:')) {
          toast.error(
            'Some relays require proof-of-work, which is not supported. Retrying with other relays...',
            { duration: 5000 }
          );
          if (retryAttempt < 2) {
            setRetryAttempt(retryAttempt + 1);
            setTimeout(() => onSubmit(values), 1500);
            return;
          }
        } else if (publishResult.error?.includes('no active subscription')) {
          toast.error(
            'Lost connection to relays. Attempting to reconnect...',
            { duration: 5000 }
          );
          if (retryAttempt < 2) {
            setRetryAttempt(retryAttempt + 1);
            setTimeout(() => onSubmit(values), 1500);
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
      console.error('[PROFILE UPDATE] Error in profile update process:', error);
      toast.error('An unexpected error occurred while updating profile', { duration: 8000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border shadow">
      <CardHeader className="pb-3">
        <CardTitle>Edit Your Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
                <TabsTrigger value="social">Social & Identity</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 pt-4">
                <BasicInfoTab form={form} />
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4 pt-4">
                <AppearanceTab form={form} />
              </TabsContent>

              <TabsContent value="social" className="space-y-4 pt-4">
                <SocialIdentityTab
                  form={form}
                  isNip05Verified={isNip05Verified}
                  isNip05Verifying={isNip05Verifying}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onSaved}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditProfileSection;