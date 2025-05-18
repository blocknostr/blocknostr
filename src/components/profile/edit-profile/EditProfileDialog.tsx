import React, { useState, useEffect, useRef } from 'react';
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
  profile: any;
  onProfileUpdate: () => void;
}

const IMGBB_API_KEY = "07a10679fd99b0330731ae1c77905806"; // Updated with user's ImgBB API key

export default function EditProfileDialog({
  open,
  onOpenChange,
  profile,
  onProfileUpdate
}: EditProfileDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Initialize form with profile data
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || '',
      display_name: profile?.display_name || '',
      picture: profile?.picture || '',
      banner: profile?.banner || '',
      about: profile?.about || '',
      website: profile?.website || '',
      nip05: profile?.nip05 || ''
    }
  });

  // Helper to get the current user's pubkey
  const pubkey = nostrService.publicKey;
  const cacheKey = pubkey ? `nostr_profile_${pubkey}` : null;

  // Track previous open state to only reset on open transition
  const [wasOpen, setWasOpen] = useState(false);
  useEffect(() => {
    if (open && !wasOpen) {
      form.reset({
        name: profile?.name || '',
        display_name: profile?.display_name || '',
        picture: profile?.picture || '',
        banner: profile?.banner || '',
        about: profile?.about || '',
        website: profile?.website || '',
        nip05: profile?.nip05 || ''
      });
    }
    setWasOpen(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Cache expiry in ms (24 hours)
  const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000;

  // On dialog open, load from cache if available and not expired
  useEffect(() => {
    if (open && cacheKey) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          const now = Date.now();
          if (!parsed._cachedAt || now - parsed._cachedAt < CACHE_EXPIRY_MS) {
            form.reset({
              name: parsed.name || '',
              display_name: parsed.display_name || '',
              picture: parsed.picture || '',
              banner: parsed.banner || '',
              about: parsed.about || '',
              website: parsed.website || '',
              nip05: parsed.nip05 || ''
            });
          } else {
            localStorage.removeItem(cacheKey); // expired
          }
        } catch (err) {
          console.error('Error loading profile from cache:', err);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // On save, update the cache with timestamp
  async function onSubmit(values: ProfileFormValues) {
    setIsSubmitting(true);
    try {
      console.log("Updating profile with values:", values);

      // Filter out empty fields to prevent overwriting with empty values
      const cleanedValues: Record<string, string> = {};
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          cleanedValues[key] = value;
        }
      });

      // Update profile using nostrService (will create a kind 0 event)
      const updated = await nostrService.updateProfile(cleanedValues);

      if (updated) {
        if (cacheKey) {
          localStorage.setItem(cacheKey, JSON.stringify({ ...cleanedValues, _cachedAt: Date.now() }));
        }
        toast.success("Profile updated successfully");
        onProfileUpdate(); // Trigger profile refresh
        onOpenChange(false); // Close dialog
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

  // Helper to upload image to ImgBB (simpler alternative to ImageKit)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Convert file to base64
      const base64Image = await convertFileToBase64(file);
      if (!base64Image) throw new Error("Failed to convert image");

      // Extract the base64 data (remove the data:image/xxx;base64, prefix)
      const base64Data = base64Image.split(',')[1];

      // Create form data for ImgBB upload
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64Data);
      formData.append('name', `avatar-${Date.now()}`);

      // Upload to ImgBB
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        // Use the URL from the response
        form.setValue('picture', data.data.url, { shouldValidate: true });

        // Update cache with the new avatar URL to ensure it persists
        if (cacheKey) {
          try {
            const cached = localStorage.getItem(cacheKey);
            const cachedData = cached ? JSON.parse(cached) : {};
            localStorage.setItem(cacheKey, JSON.stringify({
              ...cachedData,
              picture: data.data.url,
              _cachedAt: Date.now()
            }));
          } catch (err) {
            console.error('Error updating profile cache:', err);
          }
        }

        toast.success('Avatar uploaded!');

        // Notify parent component to refresh the profile with the new avatar
        // This ensures the avatar is updated in the UI immediately
        onProfileUpdate();
      } else {
        console.error('Upload response:', data);
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
      // Reset file input so user can re-upload same file if needed
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Clear cache on logout or pubkey change
  useEffect(() => {
    const handleLogout = () => {
      if (cacheKey) localStorage.removeItem(cacheKey);
    };
    window.addEventListener('nostr-logout', handleLogout);
    return () => {
      window.removeEventListener('nostr-logout', handleLogout);
    };
  }, [cacheKey]);

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
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 items-center">
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          style={{ display: 'none' }}
                          onChange={handleAvatarUpload}
                          disabled={uploading}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload Avatar'}
                        </Button>
                      </div>

                      {/* Preview avatar */}
                      {field.value && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-primary/20">
                            <img
                              src={field.value}
                              alt="Avatar preview"
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                // Handle image load error
                                console.warn('Error loading avatar preview');
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Avatar';
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">Preview</span>
                        </div>
                      )}
                    </div>
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
}
