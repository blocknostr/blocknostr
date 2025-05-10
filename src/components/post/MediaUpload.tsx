
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { toast } from "sonner";

interface MediaUploadProps {
  onMediaAdded: (url: string) => void;
}

// This is a placeholder implementation - in a production app,
// you would use a proper media upload service
const MediaUpload: React.FC<MediaUploadProps> = ({ onMediaAdded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Only images (JPEG, PNG, GIF, WEBP) are supported");
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large (max 5MB)");
      return;
    }
    
    setIsUploading(true);
    
    try {
      // This is a placeholder for an actual upload service
      // In a real app, you would upload to a service like:
      // - Supabase Storage
      // - Nostr-specific media services
      // - Other image hosting services
      
      // For now, we'll use a local URL to demonstrate the UI
      const imageUrl = URL.createObjectURL(file);
      
      // Simulate a delay to show the upload process
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Provide the URL to the parent component
      onMediaAdded(imageUrl);
      
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success("Media added successfully");
    } catch (error) {
      console.error("Failed to upload media:", error);
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
      <Button
        variant="ghost"
        size="icon"
        type="button"
        className="rounded-full"
        onClick={handleClick}
        disabled={isUploading}
      >
        <Image className="h-5 w-5" />
        <span className="sr-only">Add media</span>
      </Button>
    </>
  );
};

export default MediaUpload;
