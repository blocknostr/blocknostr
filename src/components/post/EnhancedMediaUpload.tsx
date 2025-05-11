
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UploadArea from './media/UploadArea';
import ImageUrlForm from './media/ImageUrlForm';

interface EnhancedMediaUploadProps {
  onMediaAdded: (url: string) => void;
}

const EnhancedMediaUpload: React.FC<EnhancedMediaUploadProps> = ({ onMediaAdded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    setIsDialogOpen(true);
    // Reset state when opening dialog
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage(undefined);
  };
  
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setUploadStatus('uploading');
    setErrorMessage(undefined);
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }
      
      // This is a placeholder for an actual upload service
      const imageUrl = URL.createObjectURL(file);
      setUploadStatus('success');
      
      // Provide the URL to the parent component
      onMediaAdded(imageUrl);
      
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success("Media uploaded successfully");
      setTimeout(() => {
        setIsDialogOpen(false);
        setUploadStatus('idle');
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error("Failed to upload media:", error);
      setUploadStatus('error');
      setErrorMessage("Failed to upload. Please try again.");
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUrlSubmit = (imageUrl: string) => {
    try {
      // Basic URL validation
      new URL(imageUrl);
      
      // Add the URL to the post
      onMediaAdded(imageUrl);
      
      // Close dialog and reset
      setIsDialogOpen(false);
      toast.success("Image added successfully");
      
    } catch (error) {
      toast.error("Please enter a valid URL");
    }
  };
  
  return (
    <>
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Media</DialogTitle>
            <DialogDescription>
              Upload an image or paste a URL to add to your post
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="upload">Upload File</TabsTrigger>
              <TabsTrigger value="url">Image URL</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                />
                
                <UploadArea
                  uploadStatus={uploadStatus}
                  uploadProgress={uploadProgress}
                  onAreaClick={handleFileInputClick}
                  errorMessage={errorMessage}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <ImageUrlForm onUrlSubmit={handleUrlSubmit} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedMediaUpload;
