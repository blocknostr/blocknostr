
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface MediaPreviewProps {
  file: File;
  onRemove: () => void;
}

const MediaPreview = ({ file, onRemove }: MediaPreviewProps) => {
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  const url = URL.createObjectURL(file);
  
  return (
    <div className="relative group rounded-md overflow-hidden border w-24 h-24">
      <AspectRatio ratio={1}>
        {isImage && (
          <img
            src={url}
            alt={file.name}
            className="object-cover w-full h-full"
          />
        )}
        {isVideo && (
          <video
            src={url}
            className="object-cover w-full h-full"
          />
        )}
      </AspectRatio>
      
      <Button
        onClick={onRemove}
        size="icon"
        variant="destructive"
        className="absolute top-1 right-1 h-5 w-5 opacity-80 hover:opacity-100"
      >
        <X size={12} />
      </Button>
    </div>
  );
}

export { MediaPreview };
