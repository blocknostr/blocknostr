
import React from "react";
import { useChat } from "./useChat";

import ChatHeader from "./ChatHeader";
import ChatPlaceholder from "./ChatPlaceholder";
import ChatInput from "./ChatInput";
import OriginalPost from "./OriginalPost";
import CommentsSection from "./CommentsSection";

interface DiscordStyleChatProps {
  selectedNote: any;
  profiles: Record<string, any>;
}

const DiscordStyleChat: React.FC<DiscordStyleChatProps> = ({ 
  selectedNote,
  profiles
}) => {
  // Use the chat hook to handle all the chat logic
  const {
    comments,
    emojiReactions,
    handleSendComment,
    handleEmojiReaction,
    getAuthorInfo,
    getFormattedDate
  } = useChat(selectedNote, profiles);
  
  // Chat placeholder when no note is selected
  if (!selectedNote) {
    return (
      <div className="flex flex-col h-full bg-background">
        <ChatHeader />
        <ChatPlaceholder />
      </div>
    );
  }
  
  // Get author info using the hook
  const { authorName, authorPicture, avatarFallback } = getAuthorInfo();
  
  // Get formatted date using the hook
  const formattedDate = getFormattedDate();

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <ChatHeader title={selectedNote.title} />
      
      {/* Chat content area */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Original post */}
        <OriginalPost 
          note={selectedNote}
          authorName={authorName}
          authorPicture={authorPicture}
          avatarFallback={avatarFallback}
          formattedDate={formattedDate}
          emojiReactions={emojiReactions}
          onEmojiReaction={handleEmojiReaction}
        />
        
        {/* Comments section */}
        <CommentsSection
          comments={comments}
          profiles={profiles}
          emojiReactions={emojiReactions}
          onEmojiReaction={handleEmojiReaction}
        />
      </div>
      
      {/* Input area */}
      <ChatInput 
        onSendMessage={handleSendComment} 
        isLoggedIn={!!selectedNote && !!selectedNote.author} 
      />
    </div>
  );
};

export default DiscordStyleChat;
