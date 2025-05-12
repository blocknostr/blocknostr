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

interface ProfileData {
  about?: string;
  name?: string;
  picture?: string;
  [key: string]: string | undefined;
}

interface EditProfileSectionProps {
  profileData: ProfileData;
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

  const onSubmit = async (values: ProfileData) => {
    if (!nostrService.publicKey) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsSubmitting(true);
    console.log('[PROFILE UPDATE] Starting profile update with values:', values);

    try {
      console.log('[PROFILE UPDATE] Checking relay connections before publishing profile update...');
      const relays = nostrService.getRelayStatus();
      console.log('[PROFILE UPDATE] Current relay status:', relays);
      const connectedRelays = relays.filter(r => r.status === 'connected');

      if (connectedRelays.length === 0) {
        console.log('[PROFILE UPDATE] No connected relays found, connecting to default relays...');
        await nostrService.connectToDefaultRelays();
        const updatedRelays = nostrService.getRelayStatus();
        console.log('[PROFILE UPDATE] Relay status after connection attempt:', updatedRelays);
        const nowConnected = updatedRelays.filter(r => r.status === 'connected');

        if (nowConnected.length === 0) {
          toast.error('Unable to connect to any relays. Please check your internet connection.');
          setIsSubmitting(false);
          return;
        }

        console.log('[PROFILE UPDATE] Successfully connected to relays:', nowConnected.map(r => r.url));
      } else {
        console.log('[PROFILE UPDATE] Already connected to relays:', connectedRelays.map(r => r.url));
      }

      // Safe handling of values and URLs
      const cleanValues: ProfileData = {};
      
      try {
        Object.entries(values).forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            // Special handling for URLs
            if (key === 'picture' || key === 'banner') {
              const sanitized = sanitizeImageUrl(value);
              
              // Only include valid URLs
              if (sanitized && (
                  sanitized.startsWith('http://') || 
                  sanitized.startsWith('https://') || 
                  sanitized.startsWith('data:') ||
                  sanitized.startsWith('/') ||
                  sanitized.startsWith(window.location.origin)
              )) {
                cleanValues[key] = sanitized;
              } else {
                console.warn(`[PROFILE UPDATE] Excluding invalid ${key} URL:`, value);
              }
            } else {
              cleanValues[key] = value;
            }
          }
        });
      } catch (valuesError) {
        console.error('[PROFILE UPDATE] Error processing profile values:', valuesError);
        toast.error('Error processing profile data');
        setIsSubmitting(false);
        return;
      }

      console.log('[PROFILE UPDATE] Cleaned profile values:', cleanValues);

      const publishResult = await publishProfileWithFallback({
        kind: 0,
        content: JSON.stringify(cleanValues),
        tags: []
      }, connectedRelays.map(r => r.url));

      if (publishResult.success) {
        toast.success('Profile updated successfully');
        console.log('[PROFILE UPDATE] Broadcasting profilePublished event with eventId:', publishResult.eventId);
        window.dispatchEvent(new CustomEvent('profilePublished', {
          detail: {
            pubkey: nostrService.publicKey,
            eventId: publishResult.eventId
          }
        }));
        onSaved();
      } else {
        console.error('[PROFILE UPDATE] Failed to publish profile:', publishResult.error);
        toast.error('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('[PROFILE UPDATE] Unexpected error during profile update:', error);
      toast.error('An unexpected error occurred. Please try again later.');
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
