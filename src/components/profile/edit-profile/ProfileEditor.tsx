
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileFormValues } from './types';
import { Loader2 } from 'lucide-react';

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().optional(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().optional(),
  nip05: z.string().optional(),
  lud16: z.string().optional(),
  picture: z.string().url().optional().or(z.literal('')),
  banner: z.string().url().optional().or(z.literal('')),
});

const ProfileEditor = () => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Record<string, any>>({});

  // Initialize form with react-hook-form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      displayName: '',
      bio: '',
      website: '',
      nip05: '',
      lud16: '',
      picture: '',
      banner: ''
    },
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!nostrService.publicKey) return;

      try {
        const profileData = await nostrService.getUserProfile(nostrService.publicKey);
        if (profileData) {
          setProfile(profileData);
          
          // Set form values from profile data
          form.reset({
            name: profileData.name || '',
            displayName: profileData.display_name || '',
            bio: profileData.about || '',
            website: profileData.website || '',
            nip05: profileData.nip05 || '',
            lud16: profileData.lud16 || '',
            picture: profileData.picture || '',
            banner: profileData.banner || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile data');
      }
    };

    loadProfile();
  }, [form]);

  // Handle form submission
  const onSubmit = async (values: ProfileFormValues) => {
    if (!nostrService.publicKey) {
      toast.error('You need to be logged in to update your profile');
      return;
    }

    setLoading(true);

    try {
      // Convert form values to Nostr metadata format
      const metadata: Record<string, any> = {
        name: values.name,
        display_name: values.displayName,
        about: values.bio,
        picture: values.picture,
        banner: values.banner,
        website: values.website,
        nip05: values.nip05,
        lud16: values.lud16,
      };

      // Clean up empty fields
      Object.keys(metadata).forEach(key => {
        if (!metadata[key]) {
          delete metadata[key];
        }
      });

      // Publish metadata event
      const event = await nostrService.publishMetadata(metadata);
      
      if (event) {
        toast.success('Profile updated successfully');
        // Update local profile data
        setProfile({ ...profile, ...metadata });
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Display Name */}
            <FormField
              control={form.control}
              name="displayName"
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
            
            {/* Username */}
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

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself" 
                      className="resize-none min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website */}
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

            {/* NIP-05 Identifier */}
            <FormField
              control={form.control}
              name="nip05"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP-05 Identifier</FormLabel>
                  <FormControl>
                    <Input placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Lightning Address */}
            <FormField
              control={form.control}
              name="lud16"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lightning Address</FormLabel>
                  <FormControl>
                    <Input placeholder="you@walletorlnaddress.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Profile Picture */}
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

            {/* Banner Image */}
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
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={loading} className="ml-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ProfileEditor;
