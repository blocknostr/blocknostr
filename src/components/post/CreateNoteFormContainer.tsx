
import { useRef } from 'react';
import { useNoteFormState } from '@/hooks/useNoteFormState';
import { useNoteSubmission } from '@/hooks/useNoteSubmission';
import NoteFormAvatar from './NoteFormAvatar';
import NoteFormContent from './NoteFormContent';
import { cn } from '@/lib/utils';

const CreateNoteFormContainer = () => {
  const {
    content,
    setContent,
    mediaUrls,
    setMediaUrls,
    scheduledDate,
    setScheduledDate,
    MAX_NOTE_LENGTH,
    textareaRef,
    pubkey,
    detectedHashtags
  } = useNoteFormState();
  
  const {
    isSubmitting,
    charsLeft,
    isNearLimit,
    isOverLimit,
    handleSubmit
  } = useNoteSubmission(
    content,
    setContent,
    mediaUrls,
    setMediaUrls,
    scheduledDate,
    setScheduledDate,
    detectedHashtags,
    pubkey,
    MAX_NOTE_LENGTH
  );
  
  const handleMediaAdded = (url: string) => {
    setMediaUrls(prev => [...prev, url]);
  };
  
  const removeMedia = (urlToRemove: string) => {
    setMediaUrls(prev => prev.filter(url => url !== urlToRemove));
  };
  
  const handleHashtagClick = (tag: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    
    setContent(
      content.substring(0, start) + 
      ` #${tag} ` + 
      content.substring(start)
    );
    
    // Set cursor position after the added tag
    const newPosition = start + tag.length + 3; // +3 for space, # and trailing space
    
    // Need to wait for React to update the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };
  
  if (!pubkey) {
    return null;
  }
  
  return (
    <form 
      onSubmit={handleSubmit} 
      className="mb-6 rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex gap-3 p-4">
        <NoteFormAvatar pubkey={pubkey} />
        <NoteFormContent
          content={content}
          setContent={setContent}
          textareaRef={textareaRef}
          mediaUrls={mediaUrls}
          removeMedia={removeMedia}
          handleHashtagClick={handleHashtagClick}
          detectedHashtags={detectedHashtags}
          scheduledDate={scheduledDate}
          setScheduledDate={setScheduledDate}
          handleMediaAdded={handleMediaAdded}
          charsLeft={charsLeft}
          isNearLimit={isNearLimit}
          isOverLimit={isOverLimit}
          isSubmitting={isSubmitting}
          MAX_NOTE_LENGTH={MAX_NOTE_LENGTH}
        />
      </div>
    </form>
  );
};

export default CreateNoteFormContainer;
