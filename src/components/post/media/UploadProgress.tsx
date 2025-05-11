
import { Loader2, Check } from "lucide-react";

interface UploadProgressProps {
  uploadProgress: number;
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
}

const UploadProgress = ({ uploadProgress, uploadStatus }: UploadProgressProps) => {
  if (uploadStatus === 'uploading') {
    return (
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
    );
  }

  if (uploadStatus === 'success') {
    return (
      <div className="flex flex-col items-center space-y-2 text-green-500">
        <Check className="h-8 w-8" />
        <div>Upload complete!</div>
      </div>
    );
  }

  return null;
};

export default UploadProgress;
