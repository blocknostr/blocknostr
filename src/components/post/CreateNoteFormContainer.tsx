
import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNoteFormState } from '@/hooks/useNoteFormState';
import { useNoteSubmission } from '@/hooks/useNoteSubmission';
import NoteFormAvatar from './NoteFormAvatar';
import NoteFormContent from './NoteFormContent';
import { toast } from 'sonner';
import { nostrService } from '@/lib/nostr';

// Maximum note length in characters
const MAX_NOTE_LENGTH = 280;

const CreateNoteFormContainer: React.FC = () => {
  // Get the current user's public key
  const currentUserPubkey = nostrService.publicKey;
  
  // State for the note form
  const {
    content,
    setContent,
    scheduledDate,
    setScheduledDate,
    resetForm
  } = useNoteFormState();
  
  // Submission state and handler
  const { isSubmitting, submitNote } = useNoteSubmission();
  
  // Reference to the textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate content
    if (!content || content.trim().length === 0) {
      toast.error("Can't submit an empty note");
      return;
    }
    
    if (content.length > MAX_NOTE_LENGTH) {
      toast.error(`Note is too long (${content.length}/${MAX_NOTE_LENGTH})`);
      return;
    }
    
    try {
      // Create note with content and tags
      const note = {
        content,
        tags: []
      };
      
      // Set profile picture if available
      let profilePicture = "";
      try {
        const profileData = await nostrService.getUserProfile(currentUserPubkey);
        if (profileData?.picture) {
          profilePicture = profileData.picture;
        }
      } catch (err) {
        console.warn("Could not get profile picture", err);
      }
      
      // Submit the note
      const success = await submitNote(note, scheduledDate);
      
      if (success) {
        // Reset form on success
        resetForm();
        toast.success(
          scheduledDate ? "Note scheduled successfully" : "Note published successfully"
        );
      }
    } catch (error) {
      console.error("Error submitting note:", error);
      toast.error("Failed to submit note");
    }
  };
  
  // Check if user is logged in
  const isLoggedIn = Boolean(currentUserPubkey);
  
  if (!isLoggedIn) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Please log in to create notes
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            {/* User avatar */}
            <NoteFormAvatar pubkey={currentUserPubkey} />
            
            {/* Note content editor */}
            <div className="flex-1">
              <NoteFormContent
                content={content}
                setContent={setContent}
                scheduledDate={scheduledDate}
                setScheduledDate={setScheduledDate}
                MAX_NOTE_LENGTH={MAX_NOTE_LENGTH}
                textareaRef={textareaRef}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateNoteFormContainer;
