
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nostrService } from '@/lib/nostr';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

// Define the form schema for profile editing
const profileFormSchema = z.object({
  name: z.string().max(64, "Name cannot exceed 64 characters"),
  display_name: z.string().max(100, "Display name cannot exceed 100 characters").optional(),
  picture: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  banner: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  about: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
  nip05: z.string().regex(/^[^@]+@[^@]+\.[^@]+$/, "Must be in format: name@domain.com").optional().or(z.literal(''))
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated?: () => void;
}

const EditProfileDialog = ({
  open,
  onOpenChange,
  onProfileUpdated
}: EditProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Initialize form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      display_name: '',
      picture: '',
      banner: '',
      about: '',
      website: '',
      nip05: ''
    }
  });

  // Load profile data when dialog opens
  useEffect(() => {
    if (open && nostrService.publicKey) {
      const fetchProfile = async () => {
        try {
          const profileData = await nostrService.getUserProfile(nostrService.publicKey);
          setProfile(profileData);
          
          // Reset form with profile data
          form.reset({
            name: profileData?.name || '',
            display_name: profileData?.display_name || '',
            picture: profileData?.picture || '',
            banner: profileData?.banner || '',
            about: profileData?.about || '',
            website: profileData?.website || '',
            nip05: profileData?.nip05 || ''
          });
        } catch (error) {
          console.error('Failed to fetch profile data:', error);
          toast.error('Failed to load profile data');
        }
      };
      
      fetchProfile();
    }
  }, [open, form]);

  async function onSubmit(values: ProfileFormValues) {
    setIsSubmitting(true);
    
    try {
      // Filter out empty fields to prevent overwriting with empty values
      const cleanedValues: Record<string, string> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanedValues[key] = value;
        }
      });
      
      // Update profile using nostrService
      const updated = await nostrService.updateProfile(cleanedValues);
      
      if (updated) {
        toast.success("Profile updated successfully");
        
        // Call the callback if provided
        if (onProfileUpdated) {
          onProfileUpdated();
        }
        
        // Close dialog
        onOpenChange(false);
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating your profile");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Username field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display Name field */}
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

            {/* Profile Picture field */}
            <FormField
              control={form.control}
              name="picture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Banner Image field */}
            <FormField
              control={form.control}
              name="banner"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/banner.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bio field */}
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the world about yourself"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website field */}
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

            {/* NIP-05 identifier field */}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
