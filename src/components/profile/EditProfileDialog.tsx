import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NostrProfile } from "@/lib/nostr/types"; // Adjusted import path
import { useNostr } from "@/contexts/NostrContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; // Adjusted to use sonner for consistency

// Form schema based on NIP-01 metadata fields
const profileFormSchema = z.object({
  name: z.string().max(50, "Name must be 50 characters or less").optional(),
displayName: z.string().max(50, "Display name must be 50 characters or less").optional(),
picture: z.string().url("Picture must be a valid URL").optional().or(z.literal('')),
banner: z.string().url("Banner must be a valid URL").optional().or(z.literal('')),
about: z.string().max(500, "About must be 500 characters or less").optional(),
website: z.string().url("Website must be a valid URL").optional().or(z.literal('')),
nip05: z.string().regex(/^[^@]+@[^@]+\.[^@]+$/, "NIP-05 must be in format user@domain.com").optional().or(z.literal('')),
lud16: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileDialog: React.FC<EditProfileDialogProps> = ({ open, onOpenChange }) => {
  const { profile, updateProfile, isAuthenticated } = useNostr();
  
  // Initialize the form with current profile values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
name: profile?.name || "",
displayName: profile?.displayName || "",
picture: profile?.picture || "",
banner: profile?.banner || "",
about: profile?.about || "",
website: profile?.website || "",
nip05: profile?.nip05 || "",
lud16: profile?.lud16 || "",
    },
  });

  // Reset form values when profile changes or dialog opens
  useEffect(() => {
    if (profile && open) {
form.reset({
name: profile.name || "",
displayName: profile.displayName || "",
picture: profile.picture || "",
banner: profile.banner || "",
about: profile.about || "",
website: profile.website || "",
nip05: profile.nip05 || "",
lud16: profile.lud16 || "",
      });
    }
  }, [profile, form, open]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile) return;
    
    if (!isAuthenticated) {
      toast.error("Authentication required", {
        description: "You must be logged in to update your profile",
      });
      return;
    }
    
    // Create updated profile object
    // Ensure all fields from NostrProfile are considered, even if not in the form
    const updatedProfileData: Partial<NostrProfile> = {};
    for (const key in values) {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        const formKey = key as keyof ProfileFormValues;
        // Only include the value if it's not undefined (empty strings are allowed by schema)
        if (values[formKey] !== undefined) {
          (updatedProfileData as any)[formKey] = values[formKey];
        }
      }
    }

    const finalProfile: NostrProfile = {
      ...profile, // Spread existing profile to keep fields like pubkey, npub, nip05Verified
      ...updatedProfileData, // Spread new values from the form
    };
    
    // Update profile
    const success = await updateProfile(finalProfile);
    
    if (success) {
      toast.success("Profile updated successfully!");
onOpenChange(false);
    } else {
      // Error toast is handled by updateProfile in NostrContext
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your NOSTR profile information</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormDescription>Your NIP-01 name (often a username)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Display Name" {...field} />
                    </FormControl>
                    <FormDescription>Name displayed to others (NIP-24)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>URL to your profile picture</FormDescription>
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
                      <Input placeholder="https://example.com/banner.jpg" {...field} />
                    </FormControl>
                    <FormDescription>URL to your banner image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell the world about yourself..." 
                      rows={4} 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>Your bio (max 500 characters)</FormDescription>
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
                  <FormDescription>Your personal website</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nip05"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>NIP-05 Identifier</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormDescription>Format: user@domain.com</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lud16"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lightning Address (LUD-16)</FormLabel>
                    <FormControl>
                      <Input placeholder="you@wallet.com" {...field} />
                    </FormControl>
                    <FormDescription>Your Lightning address for zaps</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                className="mr-2"
                disabled={!isAuthenticated || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={form.formState.isSubmitting}>
                Cancel
              </Button>
            </DialogFooter>
            
            {!isAuthenticated && (
              <div className="text-center text-destructive text-sm mt-2">
                You must be logged in to update your profile.
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
