
// src/components/you/EditProfileSection.tsx

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nostrService } from '@/lib/nostr';

import BasicInfoTab from './profile/BasicInfoTab';
import AppearanceTab from './profile/AppearanceTab';
import SocialIdentityTab from './profile/SocialIdentityTab';
import { useProfileForm } from './profile/useProfileForm';
import { verifyNip05Identifier } from './profile/profileUtils';
import { forceRefreshProfile } from './profile/profileUtils';

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

  const onSubmit = async (values: any) => {
    if (!nostrService.publicKey) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting profile form with values:', values);

    try {
      // 1) Ensure we're connected to relays before publishing
      console.log("Checking relay connections before publishing profile update...");
      const relays = nostrService.getRelayStatus();
      const connectedRelays = relays.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.log("No connected relays found, connecting to default relays...");
        await nostrService.connectToDefaultRelays();
        
        // Double-check we have connections after attempting to connect
        const updatedRelays = nostrService.getRelayStatus();
        const nowConnected = updatedRelays.filter(r => r.status === 'connected');
        
        if (nowConnected.length === 0) {
          toast.error("Unable to connect to any relays. Please check your internet connection.");
          setIsSubmitting(false);
          return;
        }
      }

      // 2) Clean up values by removing empty strings
      const cleanValues: Record<string, any> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanValues[key] = value;
        }
      });

      // 3) Map `about` → `bio` so your view picks it up
      if (cleanValues.about) {
        cleanValues.bio = cleanValues.about;
        delete cleanValues.about;
      }

      // 4) Log it out for debugging
      console.log('📤 cleanValues payload:', cleanValues);

      // 5) Verify NIP-05 if provided
      if (values.nip05) {
        const verified = await verifyNip05Identifier(values.nip05);
        if (!verified) {
          toast.warning(
            'NIP-05 identifier could not be verified, but will be saved'
          );
        }
      }

      // 6) Build the NIP-01 metadata event
      const eventToPublish = {
        kind: 0,
        content: JSON.stringify(cleanValues),
        tags: [],
      };

      // 7) Publish the event with error handling for POW requirements
      try {
        console.log("Publishing profile update to connected relays...");
        const success = await nostrService.publishEvent(eventToPublish);

        if (success) {
          toast.success('Profile updated successfully');

          // Delay briefly to allow relay propagation, then refresh
          setTimeout(async () => {
            if (nostrService.publicKey) {
              try {
                await forceRefreshProfile(nostrService.publicKey);
                onSaved();
              } catch (refreshError) {
                console.error("Error refreshing profile after update:", refreshError);
                // Still call onSaved even if refresh fails
                onSaved();
              }
            } else {
              onSaved();
            }
          }, 2000);
        } else {
          toast.error('Failed to update profile');
        }
      } catch (publishError: any) {
        console.error('Error publishing profile update:', publishError);
        
        // Handle specific errors
        if (publishError.message && publishError.message.includes('pow:')) {
          toast.error('This relay requires proof-of-work which is not yet supported. Try connecting to different relays.');
        } else if (publishError.message && publishError.message.includes('subscription')) {
          toast.error('Connection to relay was lost. Please try again.');
        } else {
          toast.error('An error occurred while updating profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating profile');
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
