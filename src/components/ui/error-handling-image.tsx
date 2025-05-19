import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ErrorHandlingImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  onErrorCallback?: () => void;
}

/**
 * A component that handles image loading errors gracefully
 */
const ErrorHandlingImage: React.FC<ErrorHandlingImageProps> = ({
  src,
  alt,
  className,
  fallback,
  onErrorCallback,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn(`Image failed to load: ${src}`);
    setHasError(true);
    
    // Hide the image element
    const target = e.target as HTMLImageElement;
    target.style.display = "none";
    target.onerror = null;
    
    // Call optional callback
    if (onErrorCallback) {
      onErrorCallback();
    }
  };

  if (hasError) {
    return fallback || null;
  }

  return (
    <img
      src={src}
      alt={alt || "Image"}
      className={cn("object-cover", className)}
      onError={handleError}
      {...props}
    />
  );
};

export { ErrorHandlingImage };
