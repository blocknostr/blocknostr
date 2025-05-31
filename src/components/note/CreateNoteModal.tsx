import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UnifiedCreateNote from './NewCreateNote';

interface CreateNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  // Handle successful note creation
  const handleSuccess = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
        </DialogHeader>
        <UnifiedCreateNote 
          variant="modal"
          autoFocus={true}
          onSuccess={handleSuccess}
          className="mb-0"
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateNoteModal;

