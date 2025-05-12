
import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({ 
  images, 
  initialIndex = 0, 
  isOpen, 
  onClose 
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Close lightbox on escape key
  React.useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight") {
        setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, images.length]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-white z-10 bg-black/50 rounded-full p-2"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>
        
        {/* Image */}
        <div className="w-full h-full flex items-center justify-center p-10">
          <img
            src={images[currentIndex]}
            alt="Lightbox image"
            className="max-w-full max-h-full object-contain"
          />
        </div>
        
        {/* Navigation */}
        {images.length > 1 && (
          <>
            <button
              className="absolute left-4 text-white z-10 bg-black/50 rounded-full p-2"
              onClick={() => setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1))}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              className="absolute right-4 text-white z-10 bg-black/50 rounded-full p-2"
              onClick={() => setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0))}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Counter */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
