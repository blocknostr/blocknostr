
import React from 'react';
import NoteCardComments from '../NoteCardComments';
import QuickReplies from '@/components/post/QuickReplies';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";

interface NoteCardRepliesSectionProps {
  eventId?: string;
  pubkey?: string;
  showReplyInput: boolean;
  replyContent: string;
  replyCount: number;
  replyUpdated: number;
  onReplyAdded: () => void;
  onQuickReplySelected: (text: string) => void;
}

const NoteCardRepliesSection: React.FC<NoteCardRepliesSectionProps> = ({
  eventId,
  pubkey,
  showReplyInput,
  replyContent,
  replyCount,
  replyUpdated,
  onReplyAdded,
  onQuickReplySelected
}) => {
  if (!eventId) return null;
  
  return (
    <>
      {/* Reply Accordion */}
      {replyCount > 0 && (
        <Accordion type="single" collapsible className="mt-2 border-t pt-2">
          <AccordionItem value="replies" className="border-none">
            <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
              {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
            </AccordionTrigger>
            <AccordionContent>
              <NoteCardComments 
                eventId={eventId} 
                pubkey={pubkey || ''}
                onReplyAdded={onReplyAdded}
                key={`comments-${replyUpdated}`}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      
      {/* Quick Reply Section */}
      {showReplyInput && eventId && (
        <div className="mt-3 border-t pt-3">
          <NoteCardComments 
            eventId={eventId} 
            pubkey={pubkey || ''}
            initialCommentText={replyContent}
            onReplyAdded={onReplyAdded}
          />
          
          {/* Quick Replies */}
          <div className="mt-2 pb-1">
            <QuickReplies onReplySelected={onQuickReplySelected} />
          </div>
        </div>
      )}
    </>
  );
};

export default NoteCardRepliesSection;
