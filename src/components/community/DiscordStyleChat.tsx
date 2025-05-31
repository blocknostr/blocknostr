
import React, { useState, useEffect } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { SmilePlus, SendHorizontal, MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/lib/toast";

interface DiscordStyleChatProps {
  proposalId: string;
  communityId: string;
  currentUserPubkey: string | null;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const DiscordStyleChat: React.FC<DiscordStyleChatProps> = ({ 
  proposalId,
  communityId,
  currentUserPubkey
}) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<NostrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  
  // Load comments when the component mounts
  useEffect(() => {
    const loadComments = async () => {
      if (!proposalId) return;
      
      try {
        setLoading(true);
        
        // Subscribe to comments for this proposal
        const subId = nostrService.subscribe(
          [
            {
              kinds: [1], // Regular notes
              '#e': [proposalId], // Reference to the proposal
              limit: 50
            }
          ],
          (event) => {
            setComments(prev => {
              // Avoid duplicates
              if (prev.some(c => c.id === event.id)) return prev;
              
              // Add new comment and sort by timestamp (newest first)
              return [...prev, event].sort((a, b) => b.created_at - a.created_at);
            });
          }
        );
        
        // Subscribe to reactions for this proposal and its comments
        const reactionSubId = nostrService.subscribe(
          [
            {
              kinds: [7], // Reactions
              '#e': [proposalId],
              limit: 100
            }
          ],
          handleReactionEvent
        );
        
        setLoading(false);
        
        return () => {
          nostrService.unsubscribe(subId);
          nostrService.unsubscribe(reactionSubId);
        };
      } catch (error) {
        console.error("Error loading comments:", error);
        setLoading(false);
      }
    };
    
    loadComments();
  }, [proposalId]);
  
  const handleReactionEvent = (event: NostrEvent) => {
    try {
      if (!event.content) return;
      
      // Find which event this reaction is for
      const eventTag = event.tags.find(tag => tag.length >= 2 && tag[0] === 'e');
      if (!eventTag) return;
      
      const targetId = eventTag[1];
      
      setEmojiReactions(prev => {
        const existingReactions = prev[targetId] || [];
        // Avoid duplicate emojis
        if (!existingReactions.includes(event.content)) {
          return {
            ...prev,
            [targetId]: [...existingReactions, event.content]
          };
        }
        return prev;
      });
    } catch (error) {
      console.error("Error processing reaction:", error);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !currentUserPubkey) {
      toast.error("Please enter a comment and ensure you're logged in");
      return;
    }

    try {
      setNewComment("");
      
      // Create a comment as a kind 1 post with reference to proposal
      const event = {
        kind: 1,
        content: newComment,
        tags: [
          ['e', proposalId], // Reference to the proposal
          ['e', communityId, 'root'], // Reference to the community as root
          ['t', 'proposal-comment'] // Tag to identify this as a proposal comment
        ]
      };

      const eventId = await nostrService.publishEvent(event);
      
      if (!eventId) {
        toast.error("Failed to publish comment");
        return;
      }
      
      // Add comment to local state for immediate feedback
      const localEvent: NostrEvent = {
        id: eventId,
        pubkey: currentUserPubkey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: event.tags,
        content: newComment,
        sig: ''
      };
      
      setComments(prev => [localEvent, ...prev]);
      
    } catch (error) {
      console.error("Failed to send comment:", error);
      toast.error("Failed to send comment");
    }
  };

  const handleEmojiReaction = (emoji: string, targetId: string) => {
    if (!currentUserPubkey) {
      toast.error("You must be logged in to react");
      return;
    }
    
    setEmojiReactions(prev => {
      const existingReactions = prev[targetId] || [];
      // Avoid duplicate emojis from the same action
      if (!existingReactions.includes(emoji)) {
        return {
          ...prev,
          [targetId]: [...existingReactions, emoji]
        };
      }
      return prev;
    });
    
    // Publish reaction to the nostr network
    nostrService.publishEvent({
      kind: 7, // Reaction
      content: emoji,
      tags: [
        ['e', targetId],
      ]
    }).catch(err => {
      console.error("Failed to publish reaction:", err);
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Discussion</h2>
      </div>
      
      {/* Chat content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="text-muted-foreground">Loading comments...</span>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => {
              const commentDate = formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true });
              const isCurrentUser = comment.pubkey === currentUserPubkey;
              
              return (
                <div key={comment.id} className="flex items-start gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{comment.pubkey.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className={`font-semibold text-sm mr-2 ${isCurrentUser ? "text-primary" : ""}`}>
                        {isCurrentUser ? "You" : `${comment.pubkey.substring(0, 8)}...`}
                      </span>
                      <span className="text-xs text-muted-foreground">{commentDate}</span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
                    </div>
                    
                    {/* Reactions for comments */}
                    {emojiReactions[comment.id] && emojiReactions[comment.id].length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {emojiReactions[comment.id].map((emoji, i) => (
                          <span key={i} className="bg-muted px-1.5 py-0.5 rounded-full text-xs">
                            {emoji}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Reaction button for comments */}
                    <div className="mt-1">
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
                                onClick={() => handleEmojiReaction(emoji, comment.id || '')}
                              >
                                {emoji}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-muted-foreground">No comments yet. Start the discussion!</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="border-t p-3">
        {currentUserPubkey ? (
          <div className="flex items-center gap-2">
            <Input
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
            />
            <Button 
              onClick={handleSendComment} 
              disabled={!newComment.trim()}
              size="icon"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Login to join the discussion
          </p>
        )}
      </div>
    </div>
  );
};

export default DiscordStyleChat;

