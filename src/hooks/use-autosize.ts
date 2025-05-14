
import { useEffect, RefObject } from 'react';

export const useAutosize = (
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string
) => {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to match the content
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${scrollHeight}px`;
  }, [textareaRef, value]);
};
