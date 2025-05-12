
import React, { useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileFormValues } from './useProfileForm';
import { Upload, X, Camera } from 'lucide-react';
import { toast } from 'sonner';

interface AppearanceTabProps {
  form: UseFormReturn<ProfileFormValues>;
}

const AppearanceTab: React.FC<AppearanceTabProps> = ({ form }) => {
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Get the current picture and banner values from the form
  const currentPicture = form.watch('picture');
  const currentBanner = form.watch('banner');

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image must be less than 5MB");
      return;
    }

    try {
      setAvatarUploading(true);

      // For now, we'll use a data URL approach since we don't have a backend service
      // In a production app, you would upload this to a server or a service like Nostr media server
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        // Update the form field with the data URL
        form.setValue('picture', dataUrl);
        setAvatarUploading(false);
        toast.success("Avatar uploaded successfully");
      };
      
      reader.onerror = () => {
        setAvatarUploading(false);
        toast.error("Failed to read the image");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("An error occurred while uploading your avatar");
      setAvatarUploading(false);
    }
  };

  // Banner upload handler
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, or WEBP)");
      return;
    }

    // Validate file size (max 10MB for banner as it's larger)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Image must be less than 10MB");
      return;
    }

    try {
      setBannerUploading(true);

      // For now, we'll use a data URL approach
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        // Update the form field with the data URL
        form.setValue('banner', dataUrl);
        setBannerUploading(false);
        toast.success("Banner uploaded successfully");
      };
      
      reader.onerror = () => {
        setBannerUploading(false);
        toast.error("Failed to read the image");
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading banner:", error);
      toast.error("An error occurred while uploading your banner");
      setBannerUploading(false);
    }
  };

  // Helper function to get avatar initials
  const getInitials = () => {
    const name = form.watch('name') || form.watch('display_name') || '';
    if (!name) return '?';
    return name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload Section */}
      <div className="space-y-4">
        <FormLabel className="text-base">Profile Picture</FormLabel>
        <div className="flex items-center space-x-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={currentPicture} alt="Profile" />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
              >
                {avatarUploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
              
              {currentPicture && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm"
                  onClick={() => form.setValue('picture', '')}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            <FormDescription>
              Upload a square image (JPG, PNG, GIF or WEBP, max 5MB)
            </FormDescription>
          </div>
          
          <input 
            type="file" 
            ref={avatarInputRef} 
            className="hidden"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>
      
      {/* Hidden field to store the picture URL */}
      <FormField
        control={form.control}
        name="picture"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Banner Upload Section */}
      <div className="space-y-4">
        <FormLabel className="text-base">Banner Image</FormLabel>
        <div className="relative w-full bg-muted h-32 rounded-md overflow-hidden">
          {currentBanner ? (
            <div className="absolute inset-0 bg-center bg-cover" style={{ 
              backgroundImage: `url(${currentBanner})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}>
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  {bannerUploading ? 'Uploading...' : 'Change Banner'}
                </Button>
                {currentBanner && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => form.setValue('banner', '')}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="h-8 w-8 mb-2 text-muted-foreground" />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => bannerInputRef.current?.click()}
                disabled={bannerUploading}
              >
                {bannerUploading ? 'Uploading...' : 'Upload Banner'}
              </Button>
              <FormDescription className="mt-2">
                Recommended size: 1500×500 (JPG, PNG, GIF or WEBP, max 10MB)
              </FormDescription>
            </div>
          )}
        </div>
          
        <input 
          type="file" 
          ref={bannerInputRef} 
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleBannerUpload}
        />
      </div>
      
      {/* Hidden field to store the banner URL */}
      <FormField
        control={form.control}
        name="banner"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default AppearanceTab;
