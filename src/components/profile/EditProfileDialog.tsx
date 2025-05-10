
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { nostrService } from "@/lib/nostr";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Upload, X } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(1, "Display name is required").max(50),
  username: z.string().min(1, "Username is required").max(30),
  bio: z.string().max(160, "Bio must be 160 characters or less").optional(),
  website: z.string().url("Website must be a valid URL").or(z.string().length(0)).optional(),
  nip05: z.string().optional(),
  banner: z.string().optional(),
  picture: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: any;
}

const EditProfileDialog = ({ open, onOpenChange, profileData }: EditProfileDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(profileData?.picture || null);
  const [profileBanner, setProfileBanner] = useState<string | null>(profileData?.banner || null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const navigate = useNavigate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profileData?.display_name || profileData?.name || "",
      username: profileData?.name || "",
      bio: profileData?.about || "",
      website: profileData?.website || "",
      nip05: profileData?.nip05 || "",
      banner: profileData?.banner || "",
      picture: profileData?.picture || "",
    },
  });
  
  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Profile picture must be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingPicture(true);
    
    try {
      // Convert file to base64 for now (in a real app you'd upload to a server)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfilePicture(base64);
        form.setValue("picture", base64);
        setIsUploadingPicture(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture.",
        variant: "destructive",
      });
      setIsUploadingPicture(false);
    }
  };
  
  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Banner image must be less than 10MB",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploadingBanner(true);
    
    try {
      // Convert file to base64 for now (in a real app you'd upload to a server)
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileBanner(base64);
        form.setValue("banner", base64);
        setIsUploadingBanner(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload banner image.",
        variant: "destructive",
      });
      setIsUploadingBanner(false);
    }
  };
  
  const removePicture = () => {
    setProfilePicture(null);
    form.setValue("picture", "");
  };
  
  const removeBanner = () => {
    setProfileBanner(null);
    form.setValue("banner", "");
  };
  
  const onSubmit = async (data: ProfileFormValues) => {
    if (!nostrService.privateKey) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to update your profile.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create metadata object according to NIP-01
      const metadata = {
        name: data.username,
        display_name: data.name,
        about: data.bio,
        website: data.website,
        nip05: data.nip05 || undefined,
        picture: data.picture || undefined,
        banner: data.banner || undefined,
      };
      
      // Publish metadata event (kind 0)
      const success = await nostrService.publishProfileMetadata(metadata);
      
      if (success) {
        toast({
          title: "Profile updated",
          description: "Your profile has been successfully updated.",
        });
        
        // Close the dialog and refresh the page to see changes
        onOpenChange(false);
        navigate(0); // Refresh the current page
      } else {
        toast({
          title: "Update failed",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit profile</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Banner Image */}
            <div>
              <div 
                className="h-32 w-full bg-muted rounded-md relative overflow-hidden"
                style={profileBanner ? {
                  backgroundImage: `url(${profileBanner})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {!profileBanner && <span className="text-muted-foreground text-sm">Banner image</span>}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex gap-2">
                    <label 
                      htmlFor="banner-upload" 
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer"
                    >
                      {isUploadingBanner ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                      <input
                        id="banner-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleBannerChange}
                        className="hidden"
                      />
                    </label>
                    
                    {profileBanner && (
                      <button 
                        type="button"
                        onClick={removeBanner}
                        className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Picture */}
            <div className="relative -mt-16 ml-4">
              <div 
                className="h-24 w-24 rounded-full border-4 border-background overflow-hidden relative bg-muted"
                style={profilePicture ? {
                  backgroundImage: `url(${profilePicture})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {!profilePicture && <span className="text-muted-foreground text-sm">Profile</span>}
                </div>
                
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <div className="flex gap-2">
                    <label 
                      htmlFor="picture-upload" 
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full cursor-pointer"
                    >
                      {isUploadingPicture ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Upload className="h-5 w-5" />
                      )}
                      <input
                        id="picture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handlePictureChange}
                        className="hidden"
                      />
                    </label>
                    
                    {profilePicture && (
                      <button 
                        type="button"
                        onClick={removePicture}
                        className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={50} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} maxLength={30} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        maxLength={160}
                        placeholder="Tell the world about yourself"
                      />
                    </FormControl>
                    <div className="text-xs text-muted-foreground text-right">
                      {field.value?.length || 0}/160
                    </div>
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
                        {...field} 
                        placeholder="https://example.com" 
                        type="url"
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
                    <FormLabel>NIP-05 Identifier (for verification)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="username@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
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
