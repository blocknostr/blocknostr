
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  if (!replyCount || replyCount <= 0 || !eventId) return null;
  
  return (
    <Accordion type="single" collapsible className="mt-2" data-accordion-item>
      <AccordionItem value="replies" className="border-none">
        <AccordionTrigger className="py-2 text-sm font-normal text-muted-foreground">
          {replyCount === 1 ? '1 reply' : `${replyCount} replies`}
        </AccordionTrigger>
        <AccordionContent>
          <NoteCardComments 
            eventId={eventId} 
            authorPubkey={pubkey} 
            replyUpdated={replyUpdated} 
            onReplyAdded={onReplyAdded}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default React.memo(RenderRepliesAccordion);
