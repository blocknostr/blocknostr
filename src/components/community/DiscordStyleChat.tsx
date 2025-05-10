import React, { useState, useEffect, useRef } from "react";
import { nostrService, NostrEvent } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { SendHorizontal, SmilePlus, Reply, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DiscordStyleChatProps {
  proposalId: string;
  communityId: string;
  currentUserPubkey: string | null;
}

interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: number;
  reactions: Record<string, string[]>; // emoji -> array of pubkeys who reacted
  replyTo?: string; // Optional ID of the parent comment
  deleted?: boolean;
}

// Common emoji reactions
const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const DiscordStyleChat: React.FC<DiscordStyleChatProps> = ({ 
  proposalId, 
  communityId,
  currentUserPubkey
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingComments, setLoadingComments] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when comments change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);
  
  // Load comments when component mounts
  useEffect(() => {
    const loadComments = async () => {
      await nostrService.connectToUserRelays();
      
      const commentsSubId = nostrService.subscribe(
        [
          {
            kinds: [34553], // Comment kind
            '#e': [proposalId], // Filter by proposal ID
            limit: 100
          }
        ],
        handleCommentEvent
      );
      
      // Also subscribe to deletion events
      const deletionSubId = nostrService.subscribe(
        [
          {
            kinds: [5], // Deletion kind
            limit: 100
          }
        ],
        handleDeletionEvent
      );
      
      // Cleanup subscription after timeout
      setTimeout(() => {
        setLoadingComments(false);
      }, 2000);
      
      return () => {
        nostrService.unsubscribe(commentsSubId);
        nostrService.unsubscribe(deletionSubId);
      };
    };
    
    loadComments();
  }, [proposalId]);
  
  const handleCommentEvent = (event: NostrEvent) => {
    try {
      if (!event.id || !event.pubkey) return;
      
      // Find the proposal reference tag
      const proposalTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e' && tag[1] === proposalId);
      if (!proposalTag) return;
      
      // Check for reactions
      const isReaction = event.kind === 7;
      
      if (isReaction) {
        // Process reaction event
        const targetId = event.tags.find(tag => tag[0] === 'e')?.[1];
        if (targetId && event.content) {
          setComments(prev => {
            return prev.map(comment => {
              if (comment.id === targetId) {
                // Add reaction
                const emoji = event.content;
                const reactions = {...comment.reactions};
                if (!reactions[emoji]) {
                  reactions[emoji] = [];
                }
                if (!reactions[emoji].includes(event.pubkey!)) {
                  reactions[emoji] = [...reactions[emoji], event.pubkey!];
                }
                return {...comment, reactions};
              }
              return comment;
            });
          });
        }
      } else {
        // Check if it's a reply
        let replyToId: string | undefined;
        
        // Find 'reply' tag if it exists
        for (const tag of event.tags) {
          if (tag.length >= 3 && tag[0] === 'e' && tag[3] === 'reply') {
            replyToId = tag[1];
            break;
          }
        }
        
        // Process comment event
        const comment: Comment = {
          id: event.id,
          content: event.content,
          author: event.pubkey,
          createdAt: event.created_at,
          reactions: {},
          replyTo: replyToId
        };
        
        setComments(prev => {
          // Check if we already have this comment
          if (prev.some(c => c.id === comment.id)) {
            return prev;
          }
          
          // Fetch profile data for the comment author
          fetchProfileData(event.pubkey);
          
          // Add new comment and sort by creation time
          // For replies, we want to keep them near their parent comment
          // For top-level comments, chronological ordering is fine
          return [...prev, comment].sort((a, b) => {
            // If both are replies to the same parent, sort by time
            if (a.replyTo === b.replyTo) {
              return a.createdAt - b.createdAt;
            }
            // If a is a reply to b, place a after b
            if (a.replyTo === b.id) return 1;
            // If b is a reply to a, place b after a
            if (b.replyTo === a.id) return -1;
            // Otherwise, sort chronologically
            return a.createdAt - b.createdAt;
          });
        });
      }
    } catch (e) {
      console.error("Error processing comment event:", e);
    }
  };
  
  const handleDeletionEvent = (event: NostrEvent) => {
    try {
      if (!event.id || !event.pubkey) return;
      
      // Find the deletion reference tags
      const deletedEventIds = event.tags
        .filter(tag => tag.length >= 2 && tag[0] === 'e')
        .map(tag => tag[1]);
      
      if (deletedEventIds.length === 0) return;
      
      setComments(prev => {
        return prev.map(comment => {
          // If this comment is being deleted and the deleter is the author
          if (deletedEventIds.includes(comment.id) && comment.author === event.pubkey) {
            return { ...comment, deleted: true, content: "This message was deleted" };
          }
          return comment;
        });
      });
    } catch (e) {
      console.error("Error processing deletion event:", e);
    }
  };
  
  const fetchProfileData = (authorPubkey: string) => {
    // Only fetch if we don't already have it
    if (profiles[authorPubkey]) return;
    
    const metadataSubId = nostrService.subscribe(
      [{
        kinds: [0],
        authors: [authorPubkey],
        limit: 1
      }],
      (event) => {
        try {
          const metadata = JSON.parse(event.content);
          setProfiles(prev => ({
            ...prev,
            [authorPubkey]: metadata
          }));
        } catch (e) {
          console.error('Failed to parse profile metadata:', e);
        }
      }
    );
    
    // Cleanup subscription after a short time
    setTimeout(() => {
      nostrService.unsubscribe(metadataSubId);
    }, 5000);
  };
  
  const handleSubmitComment = async () => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to comment");
      return;
    }
    
    if (!newComment.trim() || isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create tags for the comment
      const tags = [
        ['e', proposalId], // Reference to proposal
        ['e', communityId, 'root'] // Reference to community as root
      ];
      
      // Add reply tag if replying to someone
      if (replyTo) {
        tags.push(['e', replyTo.id, '', 'reply']); // Mark as reply to specific comment
        tags.push(['p', replyTo.author]); // Reference the author we're replying to
      }
      
      // Create comment event
      const event = {
        kind: 34553, // Comment kind
        content: newComment.trim(),
        tags: tags
      };
      
      const commentId = await nostrService.publishEvent(event);
      
      if (commentId) {
        // Add to local state for immediate feedback
        const newCommentObj = {
          id: commentId,
          content: newComment.trim(),
          author: currentUserPubkey,
          createdAt: Math.floor(Date.now() / 1000),
          reactions: {},
          replyTo: replyTo?.id
        };
        
        setComments(prev => [...prev, newCommentObj].sort((a, b) => {
          // Same sorting logic as in handleCommentEvent
          if (a.replyTo === b.replyTo) {
            return a.createdAt - b.createdAt;
          }
          if (a.replyTo === b.id) return 1;
          if (b.replyTo === a.id) return -1;
          return a.createdAt - b.createdAt;
        }));
        
        setNewComment("");
        setReplyTo(null); // Clear reply state
        toast.success("Comment added");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, emoji: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to react");
      return;
    }
    
    try {
      // Create reaction event
      const event = {
        kind: 7, // Reaction kind
        content: emoji,
        tags: [
          ['e', commentId], // Reference to comment
          ['p', comments.find(c => c.id === commentId)?.author || ''] // Reference to comment author
        ]
      };
      
      await nostrService.publishEvent(event);
      
      // Update local state
      setComments(prev => {
        return prev.map(comment => {
          if (comment.id === commentId) {
            const reactions = {...comment.reactions};
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            if (!reactions[emoji].includes(currentUserPubkey)) {
              reactions[emoji] = [...reactions[emoji], currentUserPubkey];
            }
            return {...comment, reactions};
          }
          return comment;
        });
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      toast.error("Failed to add reaction");
    }
  };
  
  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to delete comments");
      return;
    }
    
    setCommentToDelete(commentId);
  };
  
  const confirmDeleteComment = async () => {
    if (!commentToDelete || !currentUserPubkey) return;
    
    setIsDeletingComment(true);
    
    try {
      // Create deletion event
      const event = {
        kind: 5, // Deletion event
        content: "Comment deleted",
        tags: [
          ['e', commentToDelete] // Reference to deleted event
        ]
      };
      
      await nostrService.publishEvent(event);
      
      // Update local state immediately for better UX
      setComments(prev => prev.map(comment => 
        comment.id === commentToDelete 
          ? { ...comment, deleted: true, content: "This message was deleted" }
          : comment
      ));
      
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setCommentToDelete(null);
      setIsDeletingComment(false);
    }
  };
  
  // Get user's display name from their profile data
  const getUserDisplayInfo = (pubkey: string) => {
    const profile = profiles[pubkey];
    const npub = nostrService.getNpubFromHex(pubkey);
    const shortNpub = `${npub.substring(0, 6)}...${npub.substring(npub.length - 4)}`;
    
    return {
      name: profile?.name || profile?.display_name || shortNpub,
      picture: profile?.picture || '',
      shortNpub
    };
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: true });
  };
  
  // Render a comment with its replies
  const renderComment = (comment: Comment, isReply = false) => {
    if (!comment) return null;
    
    const { name, picture, shortNpub } = getUserDisplayInfo(comment.author);
    const timeAgo = formatTime(comment.createdAt);
    const isCurrentUser = comment.author === currentUserPubkey;
    
    return (
      <div 
        key={comment.id}
        className={`group ${isReply ? 'ml-8 mt-2' : 'mt-4'}`}
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={picture} />
            <AvatarFallback>
              {name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className={`font-medium ${isCurrentUser ? 'text-primary' : ''}`}>
                {name}
              </span>
              <span className="text-xs text-muted-foreground">@{shortNpub}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            
            <div className="mt-1 text-sm">
              {comment.deleted 
                ? <span className="italic text-muted-foreground">{comment.content}</span>
                : comment.content
              }
            </div>
            
            {/* Reactions display */}
            {Object.entries(comment.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(comment.reactions).map(([emoji, reactors]) => (
                  <div 
                    key={emoji} 
                    className="bg-muted px-2 py-0.5 rounded-full text-xs flex items-center gap-1"
                    title={`${reactors.length} ${reactors.length === 1 ? 'reaction' : 'reactions'}`}
                  >
                    <span>{emoji}</span>
                    <span>{reactors.length}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Action buttons */}
            {!comment.deleted && currentUserPubkey && (
              <div className="mt-1 flex gap-2">
                {/* Reply button */}
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setReplyTo(comment)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
                
                {/* Add reaction button */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                    >
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
                          onClick={() => handleReaction(comment.id, emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Delete button (only for comment author) */}
                {isCurrentUser && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Process comments to display threads properly
  const processedComments = comments.filter(c => !c.replyTo); // Top-level comments
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loadingComments && comments.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Loading comments...</p>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No comments yet</p>
            <p className="text-sm mt-1">Be the first to start the discussion!</p>
          </div>
        ) : (
          <>
            {/* Render top-level comments */}
            {processedComments.map(comment => (
              <React.Fragment key={comment.id}>
                {renderComment(comment)}
                
                {/* Render immediate replies to this comment */}
                {comments
                  .filter(reply => reply.replyTo === comment.id)
                  .map(reply => renderComment(reply, true))}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} /> {/* Empty div for scrolling to bottom */}
          </>
        )}
      </div>
      
      {/* Comment input area */}
      {currentUserPubkey ? (
        <div className="border-t p-4">
          {replyTo && (
            <div className="mb-2 bg-muted/50 p-2 rounded-md flex justify-between items-center">
              <div className="text-sm">
                <span className="text-muted-foreground">Replying to </span>
                <span className="font-medium">{getUserDisplayInfo(replyTo.author).name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={() => setReplyTo(null)}
              >
                <span className="sr-only">Cancel reply</span>
                ×
              </Button>
            </div>
          )}
          <Textarea 
            placeholder={replyTo ? "Write your reply..." : "Type your message here..."}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="resize-none mb-2"
            rows={2}
          />
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmitComment} 
              disabled={!newComment.trim() || isSubmitting}
              size="sm"
            >
              <SendHorizontal className="h-4 w-4 mr-2" />
              {isSubmitting ? "Sending..." : replyTo ? "Reply" : "Send"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t p-4 text-center text-muted-foreground text-sm">
          Login to join the conversation
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteComment}
              disabled={isDeletingComment}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingComment ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscordStyleChat;
