
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
import { verifyNip05Identifier, forceRefreshProfile, sanitizeImageUrl, publishProfileWithFallback } from './profile/profileUtils';

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
    console.log('[PROFILE UPDATE] Starting profile update with values:', values);

    try {
      // 1) Ensure we're connected to relays before publishing
      console.log("[PROFILE UPDATE] Checking relay connections before publishing profile update...");
      const relays = nostrService.getRelayStatus();
      console.log("[PROFILE UPDATE] Current relay status:", relays);
      const connectedRelays = relays.filter(r => r.status === 'connected');
      
      if (connectedRelays.length === 0) {
        console.log("[PROFILE UPDATE] No connected relays found, connecting to default relays...");
        await nostrService.connectToDefaultRelays();
        
        // Double-check we have connections after attempting to connect
        const updatedRelays = nostrService.getRelayStatus();
        console.log("[PROFILE UPDATE] Relay status after connection attempt:", updatedRelays);
        const nowConnected = updatedRelays.filter(r => r.status === 'connected');
        
        if (nowConnected.length === 0) {
          toast.error("Unable to connect to any relays. Please check your internet connection.");
          setIsSubmitting(false);
          return;
        }
        
        console.log("[PROFILE UPDATE] Successfully connected to relays:", nowConnected.map(r => r.url));
      } else {
        console.log("[PROFILE UPDATE] Already connected to relays:", connectedRelays.map(r => r.url));
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

      // 4) Map `about` → `bio` so your view picks it up
      if (cleanValues.about) {
        cleanValues.bio = cleanValues.about;
        delete cleanValues.about;
      }

      // 5) Log it out for debugging
      console.log('[PROFILE UPDATE] Clean values payload:', cleanValues);

      // 6) Verify NIP-05 if provided
      if (values.nip05) {
        console.log("[PROFILE UPDATE] Verifying NIP-05 identifier:", values.nip05);
        const verified = await verifyNip05Identifier(values.nip05);
        console.log("[PROFILE UPDATE] NIP-05 verification result:", verified);
        if (!verified) {
          toast.warning(
            'NIP-05 identifier could not be verified, but will be saved'
          );
        }
      }

      // 7) Build the NIP-01 metadata event
      const eventToPublish = {
        kind: 0,
        content: JSON.stringify(cleanValues),
        tags: [],
      };

      console.log("[PROFILE UPDATE] Event to publish:", eventToPublish);
      
      // Get relay URLs for potential fallback publishing
      const relayUrls = connectedRelays.map(r => r.url);

      // 8) Use our enhanced publishing function with fallbacks
      const { success, error } = await publishProfileWithFallback(eventToPublish, relayUrls);
      
      if (success) {
        toast.success('Profile updated successfully');

        // Delay briefly to allow relay propagation, then refresh
        console.log("[PROFILE UPDATE] Waiting for relay propagation before refreshing");
        setTimeout(async () => {
          if (nostrService.publicKey) {
            try {
              console.log("[PROFILE UPDATE] Forcing profile refresh after update");
              await forceRefreshProfile(nostrService.publicKey);
              console.log("[PROFILE UPDATE] Profile refresh completed, calling onSaved()");
              onSaved();
            } catch (refreshError) {
              console.error("[PROFILE UPDATE] Error refreshing profile after update:", refreshError);
              // Still call onSaved even if refresh fails
              console.log("[PROFILE UPDATE] Calling onSaved() despite refresh error");
              onSaved();
            }
          } else {
            console.log("[PROFILE UPDATE] No public key available for refresh, calling onSaved()");
            onSaved();
          }
        }, 2000);
      } else {
        // Display specific error if available
        console.error("[PROFILE UPDATE] Profile update failed:", error);
        
        if (error?.includes("authorization") || error?.includes("Unauthorized")) {
          toast.error("Your Nostr extension doesn't match your current identity. Try disconnecting and reconnecting.", {
            duration: 6000
          });
        } else if (error?.includes("proof-of-work") || error?.includes("pow:")) {
          toast.error("This relay requires proof-of-work which is not supported. Try connecting to different relays.");
        } else {
          toast.error(error || "Failed to update profile");
        }
        
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('[PROFILE UPDATE] Error in profile update process:', error);
      toast.error('An error occurred while updating profile');
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
