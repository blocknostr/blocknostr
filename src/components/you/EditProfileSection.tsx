
// src/components/you/EditProfileSection.tsx

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface EditProfileSectionProps {
  profileData: any;
  onSaved: () => void;
}

const EditProfileSection: React.FC<EditProfileSectionProps> = ({
  profileData,
  onSaved,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { form, isNip05Verified, isNip05Verifying } = useProfileForm({
    profileData,
  });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [publishError, setPublishError] = useState<string | null>(null);

  const onSubmit = async (values: any) => {
    if (!nostrService.publicKey) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsSubmitting(true);
    setPublishError(null);
    console.log('[PROFILE UPDATE] Starting profile update with values:', values);

    try {
      // 1) Ensure we're connected to relays before publishing
      console.log('[PROFILE UPDATE] Checking relay connections before publishing profile update...');
      const relays = nostrService.getRelayStatus();
      console.log('[PROFILE UPDATE] Current relay status:', relays);
      const connectedRelays = relays.filter(r => r.status === 'connected');

      if (connectedRelays.length === 0) {
        console.log('[PROFILE UPDATE] No connected relays found, connecting to default relays...');
        await nostrService.connectToDefaultRelays();

        // Double-check we have connections after attempting to connect
        const updatedRelays = nostrService.getRelayStatus();
        console.log('[PROFILE UPDATE] Relay status after connection attempt:', updatedRelays);
        const nowConnected = updatedRelays.filter(r => r.status === 'connected');

        if (nowConnected.length === 0) {
          setPublishError('Unable to connect to any relays. Try adding relays in the profile settings.');
          setIsSubmitting(false);
          return;
        }

        console.log('[PROFILE UPDATE] Successfully connected to relays:', nowConnected.map(r => r.url));
      } else {
        console.log('[PROFILE UPDATE] Already connected to relays:', connectedRelays.map(r => r.url));
      }

      // 2) Clean up values by removing empty strings
      const cleanValues: Record<string, any> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanValues[key] = value;
        }
      });

      // 3) Sanitize image URLs
      if (cleanValues.picture) {
        cleanValues.picture = sanitizeImageUrl(cleanValues.picture);
      }
      if (cleanValues.banner) {
        cleanValues.banner = sanitizeImageUrl(cleanValues.banner);
      }

      // 4) Log it out for debugging
      console.log('[PROFILE UPDATE] Clean values payload:', cleanValues);

      // 5) Verify NIP-05 if provided
      if (values.nip05) {
        console.log('[PROFILE UPDATE] Verifying NIP-05 identifier:', values.nip05);
        const verified = await verifyNip05Identifier(values.nip05);
        console.log('[PROFILE UPDATE] NIP-05 verification result:', verified);
        if (!verified) {
          toast.warning('NIP-05 identifier could not be verified, but will be saved');
        }
      }

      // 6) Build the NIP-01 metadata event with proper type
      const eventToPublish: Pick<UnsignedEvent, 'kind' | 'content' | 'tags'> = {
        kind: 0,
        content: JSON.stringify(cleanValues),
        tags: [],
      };
      console.log('[PROFILE UPDATE] Event to publish:', eventToPublish);

      // Get relay URLs for potential fallback publishing
      const relayUrls = connectedRelays.map(r => r.url);
      
      // Add some known good non-POW relays if we don't have many
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

      // 7) Use our enhanced publishing function with fallbacks
      const publishResult = await publishProfileWithFallback(eventToPublish, relayUrls);

      if (publishResult.success) {
        toast.success('Profile updated successfully');
        setPublishError(null);

        // Dispatch an event to notify that the profile was published
        if (nostrService.publicKey) {
          console.log('[PROFILE UPDATE] Broadcasting profilePublished event with eventId:', publishResult.eventId);
          window.dispatchEvent(new CustomEvent('profilePublished', { 
            detail: { 
              pubkey: nostrService.publicKey,
              eventId: publishResult.eventId
            } 
          }));
        }

        // Reset retry attempts
        setRetryAttempt(0);
        
        // Force refresh profile to ensure we have the latest data
        console.log('[PROFILE UPDATE] Forcing profile refresh after update');
        if (nostrService.publicKey) {
          await forceRefreshProfile(nostrService.publicKey);
        }

        console.log('[PROFILE UPDATE] Profile refresh completed, calling onSaved()');
        // Call onSaved, the profile will be refreshed via event listeners
        onSaved();
      } else {
        // Display specific error if available
        console.error('[PROFILE UPDATE] Profile update failed:', publishResult.error);
        setPublishError(publishResult.error || 'Failed to update profile');

        if (publishResult.error?.includes('proof-of-work') || publishResult.error?.includes('pow:')) {
          // Try again with different relays if we haven't exceeded retry limit
          if (retryAttempt < 2) {
            const newRetryCount = retryAttempt + 1;
            setRetryAttempt(newRetryCount);
            toast.loading('Retrying with different relays...');
            setTimeout(() => {
              onSubmit(values);
            }, 1500);
            return;
          }
        } else if (publishResult.error?.includes('no active subscription')) {
          // Try reconnecting to relays and retry once if we haven't exceeded retry limit
          if (retryAttempt < 2) {
            toast.loading('Reconnecting to relays...');
            setTimeout(async () => {
              await nostrService.connectToDefaultRelays();
              const newRetryCount = retryAttempt + 1;
              setRetryAttempt(newRetryCount);
              onSubmit(values);
            }, 2000);
            return;
          }
        }
      }
    } catch (error) {
      console.error('[PROFILE UPDATE] Error in profile update process:', error);
      setPublishError('An error occurred while updating profile');
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
