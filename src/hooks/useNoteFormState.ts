
import { useState, useRef } from 'react';
import { nostrService } from "@/lib/nostr";
import { useHashtagDetector } from '@/hooks/useHashtagDetector';

export const useNoteFormState = () => {
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use our hashtag detector
  const detectedHashtags = useHashtagDetector(content);
  
  const pubkey = nostrService.publicKey;
  
  // Max note length (for UI only, actual limit depends on relays)
  const MAX_NOTE_LENGTH = 280;
  
  return {
    content,
    setContent,
    mediaUrls,
    setMediaUrls,
    scheduledDate,
    setScheduledDate,
    showQuickReplies,
    setShowQuickReplies,
    textareaRef,
    pubkey,
    detectedHashtags,
    MAX_NOTE_LENGTH
  };
};
