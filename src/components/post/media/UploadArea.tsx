
import React from 'react';
import { Loader2, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadAreaProps {
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadProgress: number;
  onAreaClick: () => void;
  errorMessage?: string;
}

const UploadArea: React.FC<UploadAreaProps> = ({ 
  uploadStatus, 
  uploadProgress, 
  onAreaClick, 
  errorMessage 
}) => {
  // Safe handling of upload progress to avoid NaN or out of bounds values
  const safeProgress = isNaN(uploadProgress) ? 0 : Math.max(0, Math.min(100, uploadProgress));
  
  if (uploadStatus === 'uploading') {
    return (
      <div className="w-full flex flex-col items-center py-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
        <p className="text-sm text-muted-foreground mb-2">Uploading image...</p>
        <Progress value={safeProgress} className="w-full max-w-xs" />
      </div>
    );
  }
  
  if (uploadStatus === 'error') {
    return (
      <div className="w-full flex flex-col items-center py-4">
        <AlertCircle className="h-10 w-10 text-destructive mb-2" />
        <p className="text-sm text-destructive font-medium mb-1">Upload failed</p>
        {errorMessage && (
          <p className="text-xs text-muted-foreground mb-3">{errorMessage}</p>
        )}
        <Button variant="outline" size="sm" onClick={onAreaClick}>
          Try again
        </Button>
      </div>
    );
  }
  
  if (uploadStatus === 'success') {
    return (
      <div className="w-full flex flex-col items-center py-4">
        <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2">
          <span className="text-lg">✓</span>
        </div>
        <p className="text-sm text-muted-foreground">Upload successful!</p>
      </div>
    );
  }
  
  // Default: idle state
  return (
    <div className="w-full flex flex-col items-center py-6 cursor-pointer" onClick={onAreaClick}>
      <Upload className="h-10 w-10 text-muted-foreground mb-2" />
      <p className="text-sm font-medium mb-1">Upload an image</p>
      <p className="text-xs text-muted-foreground">
        Click or drag and drop
      </p>
      <p className="text-xs text-muted-foreground">
        JPEG, PNG, GIF, WEBP up to 5MB
      </p>
    </div>
  );
};

export default UploadArea;
