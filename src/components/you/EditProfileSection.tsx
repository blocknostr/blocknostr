import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

const profileSchema = z.object({
  display_name: z.string().optional(),
  name: z.string().optional(),
  about: z.string().optional(),
  website: z.string().optional(),
  picture: z.string().optional(),
  banner: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileSectionProps {
  // Only the fields we're editing
  profileData: Partial<ProfileFormValues>;
  onSaved: () => void;
}

const EditProfileSection: React.FC<EditProfileSectionProps> = ({
  profileData,
  onSaved,
}) => {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profileData.display_name ?? '',
      name: profileData.name ?? '',
      about: profileData.about ?? '',
      website: profileData.website ?? '',
      picture: profileData.picture ?? '',
      banner: profileData.banner ?? '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    const pubkey = nostrService.publicKey;
    if (!pubkey) {
      toast.error('No public key found');
      return;
    }

    const event = {
      kind: 0,
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags: [] as any[],
      content: JSON.stringify({
        name: values.name,
        display_name: values.display_name,
        about: values.about,
        website: values.website,
        picture: values.picture,
        banner: values.banner,
      }),
    };

    try {
      const signed = await nostrService.signEvent(event);
      await nostrService.publish(signed);
      toast.success('Profile updated');
      onSaved();
    } catch (err) {
      console.error('Failed to save profile:', err);
      toast.error('Failed to update profile');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

        {/* Add fields for picture and banner here if you need them */}

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
};

export default EditProfileSection;