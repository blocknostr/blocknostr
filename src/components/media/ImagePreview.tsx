
interface ImagePreviewProps {
  url: string;
  alt?: string;
  onLoad: () => void;
  onError: () => void;
}

const ImagePreview = ({ url, alt, onLoad, onError }: ImagePreviewProps) => {
  return (
    <img 
      src={url} 
      alt={alt || "Media attachment"} 
      className="w-full h-full object-cover transition-opacity duration-300"
      onLoad={onLoad}
      onError={onError}
    />
  );
};

export default ImagePreview;
