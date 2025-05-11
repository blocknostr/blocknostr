
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { QuickReply } from '@/lib/nostr/social/types';
import { AddReplyDialogProps } from './types';

const AddReplyDialog: React.FC<AddReplyDialogProps> = ({ isOpen, onOpenChange, onAddReply }) => {
  const [newReplyText, setNewReplyText] = useState('');
  const [newReplyCategory, setNewReplyCategory] = useState<QuickReply['category']>('custom');
  
  const handleAddReply = () => {
    if (newReplyText.trim()) {
      onAddReply(newReplyText, newReplyCategory);
      setNewReplyText('');
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Quick Reply</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <div className="mb-2">Reply Text</div>
            <Input 
              value={newReplyText}
              onChange={(e) => setNewReplyText(e.target.value)}
              placeholder="Type your quick reply here..."
            />
          </div>
          
          <div>
            <div className="mb-2">Category</div>
            <div className="flex w-full overflow-hidden rounded-md">
              <Button 
                type="button"
                variant={newReplyCategory === 'greeting' ? 'default' : 'outline'}
                className="flex-1 rounded-none border-r"
                onClick={() => setNewReplyCategory('greeting')}
              >
                Greeting
              </Button>
              <Button 
                type="button"
                variant={newReplyCategory === 'thanks' ? 'default' : 'outline'}
                className="flex-1 rounded-none border-r"
                onClick={() => setNewReplyCategory('thanks')}
              >
                Thanks
              </Button>
              <Button 
                type="button"
                variant={newReplyCategory === 'discussion' ? 'default' : 'outline'}
                className="flex-1 rounded-none border-r"
                onClick={() => setNewReplyCategory('discussion')}
              >
                Discussion
              </Button>
              <Button 
                type="button"
                variant={newReplyCategory === 'custom' ? 'default' : 'outline'}
                className="flex-1 rounded-none"
                onClick={() => setNewReplyCategory('custom')}
              >
                Custom
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddReply} disabled={!newReplyText.trim()}>Add Reply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddReplyDialog;
