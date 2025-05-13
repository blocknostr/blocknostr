import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nostrService } from '@/lib/nostr';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

// Import refactored components
import BasicInfoTab from './profile/BasicInfoTab';
import AppearanceTab from './profile/AppearanceTab';
import SocialIdentityTab from './profile/SocialIdentityTab';
import { useProfileForm } from './profile/useProfileForm';
import { verifyNip05Identifier, forceRefreshProfile } from './profile/profileUtils';

interface EditProfileSectionProps {
  profileData: ProfileData; // Updated to use the specific ProfileData interface
  onSaved: () => void;
}

export interface ProfileData {
  name: string;
  bio: string;
  picture: string;
  banner: string;
  nip05?: string; // Optional property
}

const EditProfileSection = ({ profileData, onSaved }: EditProfileSectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [relayConnectionError, setRelayConnectionError] = useState<string | null>(null);
  const { form, isNip05Verified, isNip05Verifying } = useProfileForm({ profileData });

  const onSubmit = async (values: ProfileData) => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to update your profile");
      return;
    }

    setIsSubmitting(true);
    setRelayConnectionError(null);

    try {
      // Check relay connection first
      const relays = nostrService.getRelayStatus();
      const connectedRelays = relays.filter(r => r.status === 'connected');

      if (connectedRelays.length === 0) {
        toast.loading("Connecting to relays...");
        await nostrService.connectToUserRelays();

        await nostrService.addMultipleRelays([
          "wss://relay.damus.io",
          "wss://nos.lol",
          "wss://relay.nostr.band",
          "wss://relay.snort.social"
        ]);

        const updatedRelays = nostrService.getRelayStatus();
        const nowConnected = updatedRelays.filter(r => r.status === 'connected');

        if (nowConnected.length === 0) {
          setRelayConnectionError("No connected relays available. Your profile will be saved locally but may not be broadcast to the network.");
          toast.warning("No relays connected. Profile may not be updated on the network.");
        }
      }

      const cleanValues: Record<string, string> = {};
      for (const key in values) {
        if (values[key]) {
          cleanValues[key] = values[key];
        }
      }

      if (values.nip05) {
        const isValid = await verifyNip05Identifier(values.nip05);
        if (!isValid) {
          toast.warning("NIP-05 identifier could not be verified, but will be saved");
        }
      }

      const eventToPublish = {
        kind: 0,
        content: JSON.stringify(cleanValues),
        tags: []
      };

      const toastId = toast.loading("Updating your profile...");
      const success = await nostrService.publishEvent(eventToPublish);

      if (success) {
        toast.dismiss(toastId);
        toast.success("Profile updated successfully");

        try {
          await forceRefreshProfile(nostrService.publicKey);
          onSaved();
        } catch (refreshError) {
          console.error("Error refreshing profile after update:", refreshError);
          onSaved();
        }
      } else {
        toast.dismiss(toastId);
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating profile");
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
        {relayConnectionError && (
          <Alert variant="warning" className="mb-4">
            <AlertTitle>Connection Issue</AlertTitle>
            <AlertDescription>{relayConnectionError}</AlertDescription>
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
              <Button
                type="submit"
                disabled={isSubmitting}
              >
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
