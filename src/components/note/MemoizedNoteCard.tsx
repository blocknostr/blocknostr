
import React from 'react';
import { NostrEvent } from '@/lib/nostr';
import { Card, CardContent } from "@/components/ui/card";
import NoteCardHeader from './NoteCardHeader';
import NoteCardContent from './NoteCardContent';
import NoteCardActions from './NoteCardActions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import NoteCardComments from './NoteCardComments';
import { Heart, RepeatIcon, ArrowUpRight } from 'lucide-react';

interface NoteCardProps {
  event: NostrEvent;
  profileData?: Record<string, any>;
  hideActions?: boolean;
  repostData?: {
    reposterPubkey: string;
    reposterProfile?: Record<string, any>;
  };
  isReply?: boolean;
  reactionData?: {
    emoji: string;
    reactionEvent: NostrEvent;
  };
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedNoteCard = React.memo(
  function NoteCard({ 
    event, 
    profileData, 
    hideActions, 
    repostData, 
    isReply, 
    reactionData 
  }: NoteCardProps) {
    // State
    const [showReplies, setShowReplies] = React.useState(false);
    const [replyCount, setReplyCount] = React.useState(0);
    const [replyUpdated, setReplyUpdated] = React.useState(0);
    
    // Validate event before rendering
    if (!event || !event.id || !event.pubkey) return null;
    
    // Handle reply added
    const handleReplyAdded = () => {
      setReplyUpdated(prev => prev + 1);
    };
    
    // Handle card click for navigation
    const handleCardClick = (e: React.MouseEvent) => {
      // If the click is on a link, button, or accordion, don't navigate
      if ((e.target as HTMLElement).closest('a') || 
          (e.target as HTMLElement).closest('button') ||
          (e.target as HTMLElement).closest('[data-accordion-item]')) {
        return;
      }
      
      if (event?.id) {
        window.location.href = `/post/${event.id}`;
      }
    };
    
    // Create a note object for actions
    const noteObj = {
      id: event?.id || '',
      author: event?.pubkey || '',
      content: event?.content || '',
      createdAt: event?.created_at || 0,
      event: event
    };
    
    return (
      <Card className="mb-4 border shadow-sm hover:shadow transition-shadow cursor-pointer overflow-hidden" 
            onClick={handleCardClick}>
        
        {/* Indicators (Repost, Reaction, Reply) */}
        {(repostData || reactionData || isReply) && (
          <>
            {/* Repost header */}
            {repostData && (
              <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
                <RepeatIcon className="h-4 w-4" />
                <span className="truncate">
                  {repostData.reposterProfile?.name || repostData.reposterPubkey.slice(0, 8)}
                  {" reposted"}
                </span>
              </div>
            )}
            
            {/* Reaction header */}
            {reactionData && (
              <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-red-500" />
                <span>Liked</span>
              </div>
            )}
            
            {/* Reply indicator */}
            {isReply && (
              <div className="px-4 pt-3 pb-0 flex items-center gap-2 text-sm text-muted-foreground">
                <ArrowUpRight className="h-4 w-4" />
                <span>Reply</span>
              </div>
            )}
          </>
        )}
        
        {/* Main Card Content */}
        <CardContent className="p-4">
          {/* Note Header */}
          <NoteCardHeader
            pubkey={event.pubkey}
            createdAt={event.created_at}
            profileData={profileData}
          />
          
          {/* Note Content */}
          <div className="mt-2">
            <NoteCardContent 
              content={event.content}
              tags={Array.isArray(event.tags) ? event.tags : []}
              event={event}
            />
          </div>
          
          {/* Note Actions */}
          {!hideActions && (
            <div className="mt-3">
              <NoteCardActions
                note={noteObj}
                setActiveReply={() => setShowReplies(!showReplies)}
                replyCount={replyCount}
              />
            </div>
          )}
          
          {/* Replies Accordion (only show if there are replies) */}
          {replyCount > 0 && (
            <Accordion type="single" collapsible className="mt-2" data-accordion-item>
              <AccordionItem value="replies" className="border-none">
                <AccordionTrigger className="py-2 text-sm font-normal text-muted-foreground">
                  {replyCount === 1 ? '1 reply' : `${replyCount} replies`}
                </AccordionTrigger>
                <AccordionContent>
                  <NoteCardComments 
                    eventId={event.id} 
                    pubkey={event.pubkey} 
                    replyUpdated={replyUpdated} 
                    onReplyAdded={handleReplyAdded}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {/* Quick Reply Section */}
          {showReplies && event.id && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex flex-col gap-2">
                <textarea 
                  className="w-full p-2 border rounded-md resize-none"
                  placeholder="Write your reply..."
                  rows={2}
                />
                <div className="flex justify-end">
                  <button className="px-4 py-1 bg-primary text-primary-foreground rounded-md text-sm">
                    Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
  // Custom comparison function to prevent unnecessary re-renders
  (prevProps, nextProps) => {
    // Only re-render if event ID changes, profile data updates, or reaction data changes
    return prevProps.event.id === nextProps.event.id && 
           JSON.stringify(prevProps.profileData) === JSON.stringify(nextProps.profileData) &&
           JSON.stringify(prevProps.reactionData) === JSON.stringify(nextProps.reactionData);
  }
);

export default MemoizedNoteCard;
