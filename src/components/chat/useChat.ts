
import { useState } from "react";
import { NostrEvent, nostrService } from "@/lib/nostr";
import { formatDistanceToNow } from "date-fns";

export const useChat = (selectedNote: any, profiles: Record<string, any>) => {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<NostrEvent[]>([]);
  const [emojiReactions, setEmojiReactions] = useState<Record<string, string[]>>({});
  
  // Profile info helpers
  const getAuthorInfo = () => {
    const authorProfile = selectedNote?.author ? profiles[selectedNote.author] : null;
    const authorName = authorProfile?.name || 
      authorProfile?.display_name || 
      (selectedNote?.author ? `${selectedNote.author.substring(0, 8)}...` : '');
    const authorPicture = authorProfile?.picture || '';
    const avatarFallback = authorName ? authorName.charAt(0).toUpperCase() : 'N';
    
    return { authorName, authorPicture, avatarFallback };
  };
  
  // Format timestamp
  const getFormattedDate = () => {
    return selectedNote ? 
      formatDistanceToNow(new Date(selectedNote.publishedAt), { addSuffix: true }) : '';
  };
  
  const handleSendComment = async (commentText: string) => {
    if (!commentText.trim() || !nostrService.publicKey || !selectedNote) return;

    try {
      // Create a comment as a kind 1 post with reference to original notebin
      const event = {
        kind: 1,
        content: commentText,
        tags: [
          ['e', selectedNote.id], // Reference to the note being commented on
          ['p', selectedNote.author] // Reference to the author of the original note
        ]
      };

      await nostrService.publishEvent(event);
      
      // In a real app, we'd wait for the relay to send us the event
      // For now, we'll just add it to our local state
      const fakeEvent: NostrEvent = {
        id: `temp-${Date.now()}`,
        pubkey: nostrService.publicKey,
        created_at: Math.floor(Date.now() / 1000),
        kind: 1,
        tags: event.tags,
        content: commentText
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
  
  return {
    comments,
    emojiReactions,
    handleSendComment,
    handleEmojiReaction,
    getAuthorInfo,
    getFormattedDate,
    setComments
  };
};
