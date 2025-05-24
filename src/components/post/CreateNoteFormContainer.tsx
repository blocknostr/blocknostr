
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useNoteFormState } from '@/hooks/useNoteFormState';
import { useNoteSubmission } from '@/hooks/useNoteSubmission';
import NoteFormAvatar from './NoteFormAvatar';
import NoteFormContent from './NoteFormContent';
import { toast } from '@/components/ui/sonner';
import { nostrService } from '@/lib/nostr';

const CreateNoteFormContainer: React.FC = () => {
  // Get the current user's public key
  const currentUserPubkey = nostrService.publicKey;
  
  // State for the note form
  const {
    content,
    setContent,
    mediaUrls,
    scheduledDate,
    setScheduledDate,
    textareaRef,
    MAX_NOTE_LENGTH,
    resetForm
  } = useNoteFormState();
  
  // Submission state and handler
  const { isSubmitting, submitNote } = useNoteSubmission();
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate content
    if (!content || content.trim().length === 0) {
      toast.warning("Can't submit an empty note", {
        description: "Please add some content to your note."
      });
      return;
    }
    
    if (content.length > MAX_NOTE_LENGTH) {
      toast.error(`Note is too long (${content.length}/${MAX_NOTE_LENGTH})`, {
        description: "Please shorten your note to fit the maximum length."
      });
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
        
        if (scheduledDate) {
          toast.success("Note scheduled successfully", {
            description: `Your note will be published on ${scheduledDate.toLocaleString()}`
          });
        } else {
          toast.success("Note published successfully", {
            description: "Your note is now visible to others."
          });
        }
      }
    } catch (error) {
      console.error("Error submitting note:", error);
      toast.error("Failed to submit note", {
        description: "Please try again or check your connection."
      });
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
