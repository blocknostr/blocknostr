import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { QuickReply } from '@/lib/nostr/social/types';
import { QuickRepliesProps } from './types';
import SuggestedReplies from './SuggestedReplies';
import CategoryTab from './CategoryTab';
import AddReplyDialog from './AddReplyDialog';

const QuickRepliesContainer: React.FC<QuickRepliesProps> = ({ onReplySelected }) => {
  // Sample quick replies
  const [replies, setReplies] = useState<QuickReply[]>([
    { id: '1', text: 'Great post! Thanks for sharing.', category: 'greeting', usageCount: 5 },
    { id: '2', text: 'I completely agree with your thoughts on this.', category: 'discussion', usageCount: 3 },
    { id: '3', text: 'Interesting perspective! Have you considered...', category: 'discussion', usageCount: 2 },
    { id: '4', text: 'Thanks for the insights!', category: 'thanks', usageCount: 7 },
    { id: '5', text: 'I\'ve been thinking about this topic too.', category: 'discussion', usageCount: 1 },
    { id: '6', text: 'Hello there! Nice to meet you.', category: 'greeting', usageCount: 4 },
    { id: '7', text: 'Could you elaborate more on that point?', category: 'discussion', usageCount: 2 },
    { id: '8', text: 'I appreciate your thoughtful response.', category: 'thanks', usageCount: 3 }
  ]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Suggested replies based on conversation context
  const [suggestedReplies] = useState<string[]>([
    "Thanks for sharing this!",
    "Interesting perspective",
    "I'd love to hear more about this"
  ]);
  
  const handleSelectReply = (text: string) => {
    onReplySelected(text);
    
    // Update usage count for the selected reply
    setReplies(prev => 
      prev.map(reply => 
        reply.text === text 
          ? { ...reply, usageCount: reply.usageCount + 1 }
          : reply
      )
    );
  };
  
  const handleAddNewReply = (text: string, category: QuickReply['category']) => {
    const newReply: QuickReply = {
      id: Date.now().toString(),
      text,
      category,
      usageCount: 0
    };
    
    setReplies(prev => [...prev, newReply]);
    setIsDialogOpen(false);
  };
  
  const handleDeleteReply = (id: string) => {
    setReplies(prev => prev.filter(reply => reply.id !== id));
  };
  
  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Quick Replies</span>
      </div>
      
      <SuggestedReplies 
        suggestions={suggestedReplies}
        onSelect={handleSelectReply}
      />
      
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="greeting">Greetings</TabsTrigger>
          <TabsTrigger value="thanks">Thanks</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="flex flex-wrap gap-2">
            <CategoryTab 
              replies={replies}
              onSelect={handleSelectReply}
              onDelete={handleDeleteReply}
            />
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="greeting" className="mt-0">
          <CategoryTab 
            replies={replies}
            category="greeting"
            onSelect={handleSelectReply}
            onDelete={handleDeleteReply}
          />
        </TabsContent>
        
        <TabsContent value="thanks" className="mt-0">
          <CategoryTab 
            replies={replies}
            category="thanks"
            onSelect={handleSelectReply}
            onDelete={handleDeleteReply}
          />
        </TabsContent>
        
        <TabsContent value="discussion" className="mt-0">
          <CategoryTab 
            replies={replies}
            category="discussion"
            onSelect={handleSelectReply}
            onDelete={handleDeleteReply}
          />
        </TabsContent>
      </Tabs>
      
      <AddReplyDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddReply={handleAddNewReply}
      />
    </div>
  );
};

export default QuickRepliesContainer;
