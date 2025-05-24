
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import NewCreateNote from './NewCreateNote';

interface CreateNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateNoteModal: React.FC<CreateNoteModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Note</DialogTitle>
        </DialogHeader>
        <NewCreateNote className="mb-0" />
      </DialogContent>
    </Dialog>
  );
};

export default CreateNoteModal;
