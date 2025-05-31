import React, { memo, useMemo, useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NostrEvent } from '@/lib/nostr';
import { MessageSquare, Heart, Share2, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNoteCard } from './hooks/useNoteCard';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileDisplayName from '@/components/profile/ProfileDisplayName';

interface NewNoteCardProps {
  event: NostrEvent;
  className?: string;
  profileData?: {
    displayName?: string | null;
    picture?: string;
    hasData?: boolean;
  };
}

// ✅ CRITICAL LCP FIX: Lazy content renderer with intersection observer
const LazyContentRenderer = memo(({ content, isExpanded, onToggle }: {
  content: string;
  isExpanded: boolean;
  onToggle: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRendered) {
          setIsVisible(true);
          setHasRendered(true);
          observer.disconnect(); // Only render once
        }
      },
      { 
        rootMargin: '100px', // Start loading 100px before visible
        threshold: 0.1 
      }
    );
    
    if (elementRef.current) {
      observer.observe(elementRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasRendered]);
  
  const shouldTruncate = content.length > 200;
  
  // ✅ PERFORMANCE: Only process content when visible
  const processedContent = useMemo(() => {
    if (!isVisible) return '';
    
    let text = isExpanded || !shouldTruncate ? content : content.slice(0, 200) + '...';
    
    // ✅ PERFORMANCE: Aggressive content sanitization
    text = text
      .replace(/[~`]/g, '') // Remove tildes and backticks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/([^\s]{40})/g, '$1 ') // Insert spaces in long sequences
      .trim();
    
    return text;
  }, [content, isExpanded, shouldTruncate, isVisible]);
  
  return (
    <div ref={elementRef} className="mb-2" style={{ minHeight: '20px' }}>
      {isVisible ? (
        <>
          <div 
            className="text-sm text-foreground"
            style={{
              lineHeight: '1.4',
              wordBreak: 'break-word',
              transform: 'translateZ(0)',
            }}
          >
            {processedContent}
          </div>
          {shouldTruncate && (
            <button 
              onClick={onToggle}
              className="text-xs text-primary hover:underline mt-1 p-0 border-0 bg-transparent cursor-pointer"
              style={{ transform: 'translateZ(0)' }}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      ) : (
        // ✅ CRITICAL: Placeholder to maintain layout without expensive content processing
        <div 
          className="text-sm text-muted-foreground animate-pulse"
          style={{ height: '20px', transform: 'translateZ(0)' }}
        >
          Loading...
        </div>
      )}
    </div>
  );
});

LazyContentRenderer.displayName = 'LazyContentRenderer';

const NewNoteCard: React.FC<NewNoteCardProps> = ({ event, className, profileData }) => {
  const noteCard = useNoteCard({ event, profileData });
  
  if (!event?.id || !event?.pubkey || !noteCard) return null;
  
  return (
    <Card 
      className={cn("p-4 hover:bg-muted/50 transition-colors", className)}
      style={{
        // ✅ CRITICAL LCP FIX: Remove expensive containment, use minimal GPU acceleration
        transform: 'translateZ(0)',
      }}
    >
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <Link to={noteCard.profileUrl}>
            <ProfileAvatar 
              pubkey={event.pubkey}
              size="lg"
              className="h-12 w-12"
              displayName={noteCard.displayName}
              picture={noteCard.picture}
            />
          </Link>
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <Link to={noteCard.profileUrl} className="font-semibold hover:underline truncate">
              <ProfileDisplayName 
                pubkey={event.pubkey}
                fallbackStyle="user"
                maxLength={25}
                displayName={noteCard.displayName}
              />
            </Link>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{noteCard.formattedTime}</span>
            </div>
          </div>

          {/* Content */}
          <LazyContentRenderer 
            content={noteCard.formattedContent}
            isExpanded={noteCard.isExpanded}
            onToggle={noteCard.toggleExpanded}
          />
          
          {/* Hashtags */}
          {noteCard.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {noteCard.hashtags.slice(0, 3).map((tag: string, index: number) => (
                <Badge key={index} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {noteCard.hashtags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{noteCard.hashtags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <button 
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
              onClick={noteCard.handleLike}
              disabled={noteCard.isLiking}
            >
              <Heart className={cn("h-4 w-4", noteCard.userHasLiked && "fill-current text-red-500")} />
              <span>{noteCard.likeCount || 0}</span>
            </button>
            
            <button 
              className="flex items-center gap-1 hover:text-green-500 transition-colors"
              onClick={noteCard.handleRepost}
              disabled={noteCard.isReposting}
            >
              <Share2 className={cn("h-4 w-4", noteCard.userHasReposted && "text-green-500")} />
              <span>{noteCard.repostCount || 0}</span>
            </button>
            
            <button 
              className="flex items-center gap-1 hover:text-blue-500 transition-colors"
              onClick={noteCard.handleReply}
            >
              <MessageSquare className="h-4 w-4" />
              <span>{noteCard.replyCount || 0}</span>
            </button>
            
            {/* Zaps - core NOSTR feature */}
            {(noteCard.zapCount || 0) > 0 && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Zap className="h-4 w-4" />
                <span>{noteCard.zapCount || 0}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

NewNoteCard.displayName = 'NewNoteCard';

// ✅ LCP OPTIMIZATION: Highly optimized memo comparison to prevent unnecessary re-renders
export default memo(NewNoteCard, (prevProps, nextProps) => {
  // Only re-render if essential props change
  if (prevProps.event.id !== nextProps.event.id) return false;
  if (prevProps.className !== nextProps.className) return false;
  
  // ✅ PERFORMANCE: Check profile data changes only if both exist
  if (prevProps.profileData && nextProps.profileData) {
    if (prevProps.profileData.displayName !== nextProps.profileData.displayName) return false;
    if (prevProps.profileData.picture !== nextProps.profileData.picture) return false;
  } else if (prevProps.profileData !== nextProps.profileData) {
    return false;
  }
  
  // ✅ PERFORMANCE: Check critical event properties for content changes
  if (prevProps.event.content !== nextProps.event.content) return false;
  if (prevProps.event.created_at !== nextProps.event.created_at) return false;
  
  return true; // Props are equal, prevent re-render
});

