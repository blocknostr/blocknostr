
import { Upload } from "lucide-react";
import UploadProgress from "./UploadProgress";

interface UploadAreaProps {
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error';
  uploadProgress: number;
  onAreaClick: () => void;
  errorMessage?: string;
}

const UploadArea = ({ 
  uploadStatus, 
  uploadProgress, 
  onAreaClick,
  errorMessage 
}: UploadAreaProps) => {
  return (
    <>
      <div 
        onClick={uploadStatus === 'idle' ? onAreaClick : undefined}
        className={`flex flex-col items-center space-y-2 ${uploadStatus === 'idle' ? 'cursor-pointer' : ''}`}
      >
        {uploadStatus === 'idle' ? (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-muted-foreground">
              Click to upload or drag & drop
            </div>
            <div className="text-xs text-muted-foreground">
              JPEG, PNG, GIF or WEBP (max 5MB)
            </div>
          </>
        ) : (
          <UploadProgress 
            uploadProgress={uploadProgress} 
            uploadStatus={uploadStatus} 
          />
        )}
      </div>
      
      {uploadStatus === 'error' && errorMessage && (
        <div className="mt-2 text-center text-destructive text-sm">
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default UploadArea;

