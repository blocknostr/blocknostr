
import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MediaUploaderProps {
  onMediaUpload: (file: File) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onMediaUpload(file);
      // Reset file input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 w-8 p-0 rounded-full"
        onClick={handleClick}
        title="Upload media"
      >
        <Camera className="h-4 w-4" />
        <span className="sr-only">Upload media</span>
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*, video/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

export default MediaUploader;
