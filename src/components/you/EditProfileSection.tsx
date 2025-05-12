
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { nostrService } from '@/lib/nostr';
import { verifyNip05 } from '@/lib/nostr/nip05';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

// Form schema based on NIP-01 metadata fields
const profileFormSchema = z.object({
  name: z.string().optional(),
  display_name: z.string().optional(),
  about: z.string().optional(),
  picture: z.string().url().optional().or(z.string().length(0)),
  banner: z.string().url().optional().or(z.string().length(0)),
  website: z.string().url().optional().or(z.string().length(0)),
  nip05: z.string().optional(),
  lud16: z.string().optional(), // Lightning address
  twitter: z.string().optional(),
  github: z.string().optional(),
  mastodon: z.string().optional(),
  nostr: z.string().optional()
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileSectionProps {
  profileData: any;
  onSaved: () => void;
}

const EditProfileSection = ({ profileData, onSaved }: EditProfileSectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNip05Verified, setIsNip05Verified] = useState<boolean | null>(null);
  const [isNip05Verifying, setIsNip05Verifying] = useState(false);

  // Initialize form with existing profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profileData.profileData?.name || '',
      display_name: profileData.profileData?.display_name || '',
      about: profileData.profileData?.about || '',
      picture: profileData.profileData?.picture || '',
      banner: profileData.profileData?.banner || '',
      website: profileData.profileData?.website || '',
      nip05: profileData.profileData?.nip05 || '',
      lud16: profileData.profileData?.lud16 || '',
      twitter: profileData.profileData?.twitter || '',
      github: profileData.profileData?.github || '',
      mastodon: profileData.profileData?.mastodon || '',
      nostr: profileData.profileData?.nostr || ''
    }
  });

  const verifyNip05Identifier = async (identifier: string) => {
    if (!identifier || !nostrService.publicKey) return;
    
    setIsNip05Verifying(true);
    setIsNip05Verified(null);
    
    try {
      const isValid = await verifyNip05(identifier, nostrService.publicKey);
      setIsNip05Verified(isValid);
      return isValid;
    } catch (error) {
      console.error("Error verifying NIP-05:", error);
      setIsNip05Verified(false);
      return false;
    } finally {
      setIsNip05Verifying(false);
    }
  };

  // Handle nip05 verification when value changes
  const nip05Value = form.watch('nip05');
  React.useEffect(() => {
    if (nip05Value) {
      const timeoutId = setTimeout(() => {
        verifyNip05Identifier(nip05Value);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsNip05Verified(null);
    }
  }, [nip05Value]);

  const onSubmit = async (values: ProfileFormValues) => {
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
      
      // If Twitter is provided, add NIP-39 tag (basic implementation)
      if (values.twitter) {
        const username = values.twitter.replace('@', '').trim();
        if (username) {
          // NIP-39 format: ["i", "twitter:username", "proof"]
          eventToPublish.tags.push(["i", `twitter:${username}`, ""]);
        }
      }
      
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
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your display name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell the world about yourself" 
                          className="min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="appearance" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="picture"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Picture URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/your-image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="banner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner Image URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/your-banner.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="social" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="nip05"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIP-05 Identifier</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="you@example.com" {...field} />
                          {nip05Value && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              {isNip05Verifying ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              ) : isNip05Verified === true ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : isNip05Verified === false ? (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              ) : null}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      {isNip05Verified === false && nip05Value && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This NIP-05 identifier cannot be verified
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter/X Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username (without @)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lud16"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lightning Address</FormLabel>
                      <FormControl>
                        <Input placeholder="your@lightning.address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
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
