
import { useEffect } from 'react';
import { RefObject } from 'react';

/**
 * Hook to automatically resize a textarea as content grows
 * @param textareaRef Reference to the textarea element
 * @param value The current value of the textarea
 */
export const useAutosize = (
  textareaRef: RefObject<HTMLTextAreaElement>,
  value?: string
) => {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to get accurate scrollHeight
    textarea.style.height = 'auto';
    
    // Set new height based on content
    const newHeight = Math.max(
      textarea.scrollHeight, // Content height
      80 // Minimum height in pixels
    );
    
    textarea.style.height = `${newHeight}px`;
  }, [value, textareaRef]);
};
