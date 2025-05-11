
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, X, Smile } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { QuickReply } from '@/lib/nostr/social/types';

interface QuickRepliesProps {
  onReplySelected: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onReplySelected }) => {
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
  const [newReplyText, setNewReplyText] = useState('');
  const [newReplyCategory, setNewReplyCategory] = useState<'greeting' | 'thanks' | 'discussion' | 'custom'>('custom');
  
  // Suggested replies based on conversation context
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([
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
  
  const handleAddNewReply = () => {
    if (newReplyText.trim()) {
      const newReply: QuickReply = {
        id: Date.now().toString(),
        text: newReplyText,
        category: newReplyCategory,
        usageCount: 0
      };
      
      setReplies(prev => [...prev, newReply]);
      setNewReplyText('');
      setIsDialogOpen(false);
    }
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
      
      <div className="flex flex-wrap gap-2 mb-2">
        {suggestedReplies.map((text, index) => (
          <Badge 
            key={index} 
            variant="secondary"
            className="cursor-pointer hover:bg-secondary/80"
            onClick={() => handleSelectReply(text)}
          >
            {text}
          </Badge>
        ))}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-4 mb-2">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="greeting">Greetings</TabsTrigger>
          <TabsTrigger value="thanks">Thanks</TabsTrigger>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0">
          <div className="flex flex-wrap gap-2">
            {replies
              .sort((a, b) => b.usageCount - a.usageCount)
              .slice(0, 6)
              .map(reply => (
                <div key={reply.id} className="relative group">
                  <Badge 
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSelectReply(reply.text)}
                  >
                    {reply.text.length > 30 ? `${reply.text.substring(0, 30)}...` : reply.text}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-4 w-4 absolute -top-1 -right-1 rounded-full bg-background text-muted-foreground hidden group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReply(reply.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </DialogTrigger>
              
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
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddNewReply} disabled={!newReplyText.trim()}>Add Reply</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
        
        <TabsContent value="greeting" className="mt-0">
          <div className="flex flex-wrap gap-2">
            {replies
              .filter(reply => reply.category === 'greeting')
              .map(reply => (
                <Badge 
                  key={reply.id} 
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleSelectReply(reply.text)}
                >
                  {reply.text}
                </Badge>
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="thanks" className="mt-0">
          <div className="flex flex-wrap gap-2">
            {replies
              .filter(reply => reply.category === 'thanks')
              .map(reply => (
                <Badge 
                  key={reply.id} 
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleSelectReply(reply.text)}
                >
                  {reply.text}
                </Badge>
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="discussion" className="mt-0">
          <div className="flex flex-wrap gap-2">
            {replies
              .filter(reply => reply.category === 'discussion')
              .map(reply => (
                <Badge 
                  key={reply.id} 
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => handleSelectReply(reply.text)}
                >
                  {reply.text}
                </Badge>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuickReplies;
