
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nostrService } from '@/lib/nostr';

// Import refactored components
import BasicInfoTab from './profile/BasicInfoTab';
import AppearanceTab from './profile/AppearanceTab';
import SocialIdentityTab from './profile/SocialIdentityTab';
import { useProfileForm } from './profile/useProfileForm';
import { verifyNip05Identifier } from './profile/profileUtils';

interface EditProfileSectionProps {
  profileData: any;
  onSaved: () => void;
}

const EditProfileSection = ({ profileData, onSaved }: EditProfileSectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { form, isNip05Verified, isNip05Verifying } = useProfileForm({ profileData });

  const onSubmit = async (values: any) => {
    if (!nostrService.publicKey) {
      toast.error("You must be logged in to update your profile");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Clean up values by removing empty strings
      const cleanValues: Record<string, any> = {};
      
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanValues[key] = value;
        }
      });
      
      // Verify NIP-05 if provided
      if (values.nip05) {
        // Fix: Only pass the identifier to the verification function
        const isValid = await verifyNip05Identifier(values.nip05);
        if (!isValid) {
          toast.warning("NIP-05 identifier could not be verified, but will be saved");
        }
      }
      
      // Create the event object - follows NIP-01 metadata event format
      const eventToPublish = {
        kind: 0, // Metadata event kind per NIP-01
        content: JSON.stringify(cleanValues),
        tags: [] // Tags for NIP-39 would go here if implemented
      };
      
      // Publish the event
      const success = await nostrService.publishEvent(eventToPublish);
      
      if (success) {
        toast.success("Profile updated successfully");
        
        // Force refresh cached profile data
        await nostrService.getUserProfile(nostrService.publicKey, true);
        
        // Trigger a refresh of the profile data
        await profileData.refreshProfile();
        
        // Notify parent component
        onSaved();
      } else {
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
