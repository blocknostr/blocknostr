
import React, { useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { SmilePlus, SendHorizontal, MessageSquare } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DiscordStyleChatProps {
  selectedNote: any;
  profiles: Record<string, any>;
}

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const DiscordStyleChat: React.FC<DiscordStyleChatProps> = ({ 
  selectedNote,
  profiles
}) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<NostrEvent[]>([]);
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});

  // Profile info for the note author
  const authorProfile = selectedNote?.author ? profiles[selectedNote.author] : null;
  const authorName = authorProfile?.name || 
    authorProfile?.display_name || 
    (selectedNote?.author ? `${selectedNote.author.substring(0, 8)}...` : '');
  const authorPicture = authorProfile?.picture || '';
  
  // Get the first character for the avatar fallback
  const avatarFallback = authorName ? authorName.charAt(0).toUpperCase() : 'N';

  // Format timestamp
  const formattedDate = selectedNote ? 
    formatDistanceToNow(new Date(selectedNote.publishedAt), { addSuffix: true }) : '';

  const handleSendComment = async () => {
    if (!newComment.trim() || !nostrService.publicKey || !selectedNote) return;

    try {
      // Create a comment as a kind 1 post with reference to original notebin
      const event = {
        kind: 1,
        content: newComment,
        tags: [
          ['e', selectedNote.id], // Reference to the note being commented on
          ['p', selectedNote.author] // Reference to the author of the original note
        ]
      };

      await nostrService.publishEvent(event);
      setNewComment("");
      
      // In a real app, we'd wait for the relay to send us the event
      // For now, we'll just add it to our local state
      const fakeEvent: NostrEvent = {
        id: `temp-${Date.now()}`,
        pubkey: nostrService.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: event.tags,
        content: newComment,
        sig: '' // Add missing sig property
      };
      
      setComments(prev => [fakeEvent, ...prev]);
    } catch (error) {
      console.error("Failed to send comment:", error);
    }
  };

  const handleEmojiReaction = (emoji: string, targetId: string) => {
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
    
    // In a real implementation, we would publish a reaction event to the nostr network
    if (nostrService.publicKey) {
      nostrService.publishEvent({
        kind: 7, // Reaction
        content: emoji,
        tags: [
          ['e', targetId],
          ['p', selectedNote?.author || '']
        ]
      }).catch(err => {
        console.error("Failed to publish reaction:", err);
      });
    }
  };

  // Chat placeholder when no note is selected
  if (!selectedNote) {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold text-muted-foreground">Chat</h2>
        </div>
        
        <div className="flex items-center justify-center flex-1">
          <div className="text-center p-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Select a note to view comments</p>
          </div>
        </div>
        
        <div className="border-t p-3">
          <p className="text-center text-sm text-muted-foreground">
            Select a note to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-lg font-semibold">{selectedNote.title}</h2>
      </div>
      
      {/* Chat content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Original post */}
        <div className="mb-6">
          <div className="flex items-start mb-1">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={authorPicture} />
              <AvatarFallback>{avatarFallback}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <span className="font-semibold mr-2">{authorName}</span>
                <span className="text-xs text-muted-foreground">{formattedDate}</span>
              </div>
              <div className="mt-1 whitespace-pre-wrap">{selectedNote.content}</div>
              
              {/* Reactions for original post */}
              {emojiReactions[selectedNote.id] && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {emojiReactions[selectedNote.id].map((emoji, i) => (
                    <span key={i} className="bg-muted px-1.5 py-0.5 rounded-full text-xs">
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Reaction button for original post */}
              <div className="mt-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <SmilePlus className="h-4 w-4 mr-1" />
                      Add Reaction
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
                          onClick={() => handleEmojiReaction(emoji, selectedNote.id)}
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
        </div>
        
        {/* Horizontal separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-xs text-muted-foreground">
              COMMENTS
            </span>
          </div>
        </div>
        
        {/* Comments */}
        <div className="mt-4 space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => {
              const commentAuthorProfile = comment.pubkey ? profiles[comment.pubkey] : null;
              const commentAuthorName = commentAuthorProfile?.name || 
                commentAuthorProfile?.display_name || 
                `${comment.pubkey?.substring(0, 8)}...`;
              const commentAuthorPicture = commentAuthorProfile?.picture || '';
              const commentAvatarFallback = commentAuthorName ? commentAuthorName.charAt(0).toUpperCase() : 'C';
              const commentDate = formatDistanceToNow(new Date(comment.created_at * 1000), { addSuffix: true });
              
              return (
                <div key={comment.id} className="flex items-start">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={commentAuthorPicture} />
                    <AvatarFallback>{commentAvatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-sm mr-2">{commentAuthorName}</span>
                      <span className="text-xs text-muted-foreground">{commentDate}</span>
                    </div>
                    <p className="text-sm mt-0.5">{comment.content}</p>
                    
                    {/* Reactions for comments */}
                    {emojiReactions[comment.id || ''] && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {emojiReactions[comment.id || ''].map((emoji, i) => (
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
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Input area */}
      {nostrService.publicKey ? (
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Write a comment..."
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
