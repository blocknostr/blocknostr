
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  url: string;
  alt?: string;
  onLoad: () => void;
  onError: () => void;
  className?: string;
}

const ImagePreview = ({ url, alt, onLoad, onError, className }: ImagePreviewProps) => {
  return (
    <img 
      src={url} 
      alt={alt || "Media attachment"} 
      className={cn("w-full h-full object-cover transition-opacity duration-300", className)}
      onLoad={onLoad}
      onError={onError}
    />
  );
};

export default ImagePreview;
