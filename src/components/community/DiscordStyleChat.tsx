
import React, { useState, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { SmilePlus, SendHorizontal, MessageSquare, Reply } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DiscordStyleChatProps {
  proposalId: string;
  communityId: string;
  currentUserPubkey: string | null;
}

interface CommentType {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  replyToId?: string;
  reactions: {[key: string]: string[]};
}

// Constants
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const COMMENT_KIND = 1; // Regular note kind for comments
const REACTION_KIND = 7; // Reaction kind

const DiscordStyleChat: React.FC<DiscordStyleChatProps> = ({ 
  proposalId,
  communityId,
  currentUserPubkey
}) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<CommentType[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load comments and reactions on mount
  useEffect(() => {
    if (!proposalId) return;
    
    setIsLoading(true);
    
    // Subscribe to comments for this proposal
    const commentsSubId = nostrService.subscribe(
      [
        {
          kinds: [COMMENT_KIND],
          '#e': [proposalId],
          limit: 100
        }
      ],
      handleCommentEvent
    );
    
    // Subscribe to reactions
    const reactionsSubId = nostrService.subscribe(
      [
        {
          kinds: [REACTION_KIND],
          '#e': [proposalId],
          limit: 100
        }
      ],
      handleReactionEvent
    );
    
    // Set loading to false after a short delay to ensure we've had time to receive some events
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => {
      nostrService.unsubscribe(commentsSubId);
      nostrService.unsubscribe(reactionsSubId);
      clearTimeout(loadingTimeout);
    };
  }, [proposalId]);
  
  // Load profiles for comment authors
  useEffect(() => {
    const authorPubkeys = [...new Set(comments.map(comment => comment.pubkey))];
    
    if (authorPubkeys.length === 0) return;
    
    const profilesSubId = nostrService.subscribe(
      [
        {
          kinds: [0], // Kind 0 is metadata
          authors: authorPubkeys,
          limit: authorPubkeys.length
        }
      ],
      handleProfileEvent
    );
    
    return () => {
      nostrService.unsubscribe(profilesSubId);
    };
  }, [comments]);
  
  const handleCommentEvent = (event: NostrEvent) => {
    try {
      if (!event.id || !event.content) return;
      
      // Check if the event is really for this proposal
      if (!event.tags.some(tag => tag[0] === 'e' && tag[1] === proposalId)) {
        return;
      }
      
      // Find reply reference if any
      const replyTag = event.tags.find(
        tag => tag.length >= 3 && tag[0] === 'e' && tag[2] === 'reply'
      );
      
      const replyToId = replyTag ? replyTag[1] : undefined;
      
      const newComment: CommentType = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at,
        replyToId,
        reactions: {}
      };
      
      setComments(prev => {
        // Skip if we already have this comment
        if (prev.some(c => c.id === event.id)) {
          return prev;
        }
        
        // Sort by time (newest first)
        return [...prev, newComment].sort((a, b) => b.createdAt - a.createdAt);
      });
    } catch (error) {
      console.error("Error processing comment:", error);
    }
  };
  
  const handleReactionEvent = (event: NostrEvent) => {
    try {
      if (!event.id || !event.content) return;
      
      // Find the comment tag
      const commentTag = event.tags.find(tag => tag[0] === 'e');
      if (!commentTag) return;
      
      const commentId = commentTag[1];
      const reaction = event.content;
      
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            // Initialize reactions object if needed
            const reactions = {...(comment.reactions || {})};
            
            if (!reactions[reaction]) {
              reactions[reaction] = [];
            }
            
            // Add reaction if not already there
            if (!reactions[reaction].includes(event.pubkey)) {
              reactions[reaction] = [...reactions[reaction], event.pubkey];
            }
            
            return { ...comment, reactions };
          }
          return comment;
        });
      });
    } catch (error) {
      console.error("Error processing reaction:", error);
    }
  };
  
  const handleProfileEvent = (event: NostrEvent) => {
    try {
      if (!event.pubkey) return;
      
      try {
        const content = JSON.parse(event.content);
        setProfiles(prev => ({
          ...prev,
          [event.pubkey]: content
        }));
      } catch (e) {
        console.error("Invalid profile metadata:", e);
      }
    } catch (error) {
      console.error("Error processing profile:", error);
    }
  };
  
  const handleSendComment = async () => {
    if (!newComment.trim() || !currentUserPubkey) return;
    
    try {
      // Create tags for the comment
      const tags = [
        ['e', proposalId], // Reference to the proposal
        ['e', communityId, 'root'], // Reference to the community as root
      ];
      
      // If replying to a specific comment
      if (replyingTo) {
        tags.push(['e', replyingTo, 'reply']);
      }
      
      // Create comment event
      const event = {
        kind: COMMENT_KIND,
        content: newComment,
        tags: tags
      };
      
      const eventId = await nostrService.publishEvent(event);
      
      if (eventId) {
        setNewComment("");
        setReplyingTo(null);
        
        // Add to local state for immediate display
        const timestamp = Math.floor(Date.now() / 1000);
        const newLocalComment: CommentType = {
          id: eventId,
          pubkey: currentUserPubkey,
          content: newComment,
          createdAt: timestamp,
          replyToId: replyingTo || undefined,
          reactions: {}
        };
        
        setComments(prev => [newLocalComment, ...prev]);
      }
    } catch (error) {
      console.error("Failed to send comment:", error);
    }
  };
  
  const handleReaction = async (emoji: string, commentId: string) => {
    if (!currentUserPubkey) return;
    
    try {
      // Create reaction event
      const event = {
        kind: REACTION_KIND,
        content: emoji,
        tags: [
          ['e', commentId],
          ['p', comments.find(c => c.id === commentId)?.pubkey || '']
        ]
      };
      
      await nostrService.publishEvent(event);
      
      // Update local state
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            const reactions = {...(comment.reactions || {})};
            
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            
            if (!reactions[emoji].includes(currentUserPubkey)) {
              reactions[emoji] = [...reactions[emoji], currentUserPubkey];
            }
            
            return { ...comment, reactions };
          }
          return comment;
        });
      });
    } catch (error) {
      console.error("Failed to publish reaction:", error);
    }
  };
  
  const renderComment = (comment: CommentType, isReply = false) => {
    const profile = comment.pubkey ? profiles[comment.pubkey] : null;
    const authorName = profile?.name || profile?.display_name || 
      `${comment.pubkey.substring(0, 8)}...`;
    const authorPicture = profile?.picture || '';
    const avatarFallback = authorName.charAt(0).toUpperCase();
    const commentDate = formatDistanceToNow(new Date(comment.createdAt * 1000), { addSuffix: true });
    
    // Find replies to this comment
    const replies = comments.filter(c => c.replyToId === comment.id);
    
    return (
      <div key={comment.id} className={`flex items-start ${isReply ? 'ml-8 mt-3' : 'mt-4'}`}>
        <Avatar className="h-8 w-8 mr-2 flex-shrink-0">
          <AvatarImage src={authorPicture} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center">
            <span className="font-semibold text-sm mr-2">{authorName}</span>
            <span className="text-xs text-muted-foreground">{commentDate}</span>
          </div>
          
          <div className="mt-0.5 text-sm whitespace-pre-wrap">{comment.content}</div>
          
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {/* Reply button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs"
              onClick={() => setReplyingTo(comment.id)}
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            
            {/* Reactions popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                  <SmilePlus className="h-3 w-3 mr-1" />
                  React
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1">
                <div className="flex gap-1">
                  {EMOJI_REACTIONS.map(emoji => (
                    <Button 
                      key={emoji} 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleReaction(emoji, comment.id)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            {/* Display reactions */}
            {comment.reactions && Object.entries(comment.reactions).map(([emoji, users]) => (
              users.length > 0 && (
                <span key={emoji} className="bg-muted px-2 py-0.5 rounded-full text-xs">
                  {emoji} {users.length}
                </span>
              )
            ))}
          </div>
          
          {/* Nested replies */}
          {replies.length > 0 && (
            <div className="mt-2 space-y-2 border-l-2 border-muted pl-2">
              {replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Filter out replies so we only render top-level comments
  const topLevelComments = comments.filter(comment => !comment.replyToId);
  
  // Chat placeholder when loading
  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold">Discussion</h2>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center p-8">
            <div className="animate-pulse flex justify-center">
              <div className="h-10 w-10 bg-muted rounded-full"></div>
            </div>
            <p className="text-muted-foreground mt-4">Loading comments...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Discussion</h2>
      </div>
      
      {/* Chat content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {topLevelComments.length > 0 ? (
          <div className="space-y-4">
            {topLevelComments.map(comment => renderComment(comment))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
      
      {/* Input area */}
      {currentUserPubkey ? (
        <div className="border-t p-3">
          {/* Reply indicator */}
          {replyingTo && (
            <div className="text-xs text-primary mb-2 flex items-center">
              <span>Replying to: </span>
              <span className="font-semibold mx-1 truncate max-w-[150px]">
                {comments.find(c => c.id === replyingTo)?.content.substring(0, 20)}...
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-1" 
                onClick={() => setReplyingTo(null)}
              >
                ✕
              </Button>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Input
              placeholder={replyingTo ? "Write your reply..." : "Write a comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
            />
            <Button 
              onClick={handleSendComment} 
              disabled={!newComment.trim()}
              size="icon"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t p-3">
          <p className="text-center text-sm text-muted-foreground">
            Login to leave a comment
          </p>
        </div>
      )}
    </div>
  );
};

export default DiscordStyleChat;
