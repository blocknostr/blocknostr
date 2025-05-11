
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
import { 
  TabsList,
  TabsTrigger 
} from "@/components/ui/tabs";
import { AddReplyDialogProps } from './types';
import { QuickReply } from '@/lib/nostr/social/types';

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
            <TabsList className="w-full">
              <TabsTrigger 
                value="greeting" 
                className={newReplyCategory === 'greeting' ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setNewReplyCategory('greeting')}
              >
                Greeting
              </TabsTrigger>
              <TabsTrigger 
                value="thanks"
                className={newReplyCategory === 'thanks' ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setNewReplyCategory('thanks')}
              >
                Thanks
              </TabsTrigger>
              <TabsTrigger 
                value="discussion"
                className={newReplyCategory === 'discussion' ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setNewReplyCategory('discussion')}
              >
                Discussion
              </TabsTrigger>
              <TabsTrigger 
                value="custom"
                className={newReplyCategory === 'custom' ? 'bg-primary text-primary-foreground' : ''}
                onClick={() => setNewReplyCategory('custom')}
              >
                Custom
              </TabsTrigger>
            </TabsList>
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
