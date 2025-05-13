
import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import NoteCardComments from '../NoteCardComments';

interface RenderRepliesAccordionProps {
  eventId?: string;
  replyCount: number;
  replyUpdated: number;
  pubkey?: string;
  onReplyAdded: () => void;
}

const RenderRepliesAccordion: React.FC<RenderRepliesAccordionProps> = ({ 
  eventId, 
  replyCount, 
  replyUpdated,
  pubkey,
  onReplyAdded
}) => {
  if (!eventId || replyCount <= 0) {
    return null;
  }
  
  return (
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
  );
};

export default RenderRepliesAccordion;
