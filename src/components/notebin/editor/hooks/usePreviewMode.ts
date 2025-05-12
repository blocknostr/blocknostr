
import { useState } from "react";
import { useHotkeys } from "../../useHotkeys";

export function usePreviewMode() {
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  // Register keyboard shortcut for preview toggle
  useHotkeys('ctrl+p', (e) => {
    e.preventDefault();
    togglePreview();
  }, [previewMode]);
  
  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };
  
  return {
    previewMode,
    togglePreview
  };
}
