
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Image, Upload, X, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EnhancedMediaUploadProps {
  onMediaAdded: (url: string) => void;
}

const EnhancedMediaUpload: React.FC<EnhancedMediaUploadProps> = ({ onMediaAdded }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    setIsDialogOpen(true);
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
    
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 20) {
        setUploadProgress(i);
        await new Promise(r => setTimeout(r, 200));
      }
      
      // This is a placeholder for an actual upload service
      // In a real app, you would upload to a service like:
      // - Supabase Storage
      // - Nostr-specific media services
      // - Other image hosting services
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
      toast.error("Failed to upload media");
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageUrl) {
      toast.error("Please enter an image URL");
      return;
    }
    
    try {
      // Basic URL validation
      new URL(imageUrl);
      
      // Add the URL to the post
      onMediaAdded(imageUrl);
      
      // Close dialog and reset
      setIsDialogOpen(false);
      setImageUrl('');
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
                
                {uploadStatus === 'uploading' ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <div>Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-muted h-2 rounded-full">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                ) : uploadStatus === 'success' ? (
                  <div className="flex flex-col items-center space-y-2 text-green-500">
                    <Check className="h-8 w-8" />
                    <div>Upload complete!</div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center space-y-2 cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-muted-foreground">
                      Click to upload or drag & drop
                    </div>
                    <div className="text-xs text-muted-foreground">
                      JPEG, PNG, GIF or WEBP (max 5MB)
                    </div>
                  </div>
                )}
              </div>
              
              {uploadStatus === 'error' && (
                <div className="mt-2 text-center text-destructive text-sm">
                  Failed to upload. Please try again.
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="url" className="mt-4">
              <form onSubmit={handleUrlSubmit}>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  <Button type="submit">Add</Button>
                </div>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  Enter the URL of an image from the web
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedMediaUpload;
