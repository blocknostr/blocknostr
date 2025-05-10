
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { nostrService } from "@/lib/nostr";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: any | null;
}

const profileSchema = z.object({
  display_name: z.string().max(50, "Display name must be 50 characters or less").optional(),
  name: z.string().max(30, "Username must be 30 characters or less").optional(),
  about: z.string().max(500, "Bio must be 500 characters or less").optional(),
  picture: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  banner: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  nip05: z.string().regex(/^[^@]+@[^@]+\.[^@]+$/, "Must be in format username@domain.com").optional().or(z.literal("")),
});

const EditProfileDialog = ({ open, onOpenChange, profileData }: EditProfileDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: profileData?.display_name || "",
      name: profileData?.name || "",
      about: profileData?.about || "",
      picture: profileData?.picture || "",
      banner: profileData?.banner || "",
      website: profileData?.website || "",
      nip05: profileData?.nip05 || "",
    },
  });
  
  const onSubmit = async (data: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Filter out empty fields to avoid overwriting with empty values
      const updatedProfile = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== "")
      );
      
      // Merge with existing profile data (if any)
      const mergedProfile = {
        ...profileData,
        ...updatedProfile,
      };
      
      // Save to Nostr
      const success = await nostrService.publishProfileMetadata(mergedProfile);
      
      if (success) {
        toast.success("Profile updated successfully");
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
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-2">
            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Your display name" 
                      {...field} 
                    />
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
                    <Input 
                      placeholder="YourUsername" 
                      {...field} 
                    />
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
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell the world about yourself" 
                      className="resize-none h-24"
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
                    <Input 
                      placeholder="https://yourwebsite.com" 
                      type="url"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nip05"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIP-05 Identifier</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="you@example.com" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="picture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Picture URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com/your-picture.jpg" 
                      type="url"
                      {...field} 
                    />
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
                    <Input 
                      placeholder="https://example.com/your-banner.jpg" 
                      type="url"
                      {...field} 
                    />
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
                  "Save changes"
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
