import React, { useState, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, Smile, AtSign, X } from "lucide-react";
import { toast } from "@/lib/toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ChatInputProps {
  isLoggedIn: boolean;
  maxChars: number;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  replyToMessage?: any;
  onClearReply?: () => void;
}

// Enhanced emoji set for reactions
const EMOJI_CATEGORIES = {
  "Smileys": ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳"],
  "Gestures": ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏"],
  "Hearts": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  "Objects": ["🔥", "💯", "💎", "⚡", "💰", "🎉", "🎊", "🏆", "🥇", "🎯", "🚀", "⭐", "🌟", "✨", "💫", "🌈", "☀️", "🌙", "⚽", "🏀", "🎮", "🎵", "��", "📱", "💻"]
};

const ChatInput: React.FC<ChatInputProps> = React.memo(({ 
  isLoggedIn, 
  maxChars, 
  onSendMessage, 
  disabled = false, 
  replyToMessage,
  onClearReply 
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ FIXED: Memoize event handlers to prevent re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Check for mentions
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1 && lastAtIndex === value.length - 1) {
      setShowMentions(true);
      setMentionSearch("");
    } else if (lastAtIndex !== -1 && value.slice(lastAtIndex).includes(' ')) {
      setShowMentions(false);
    } else if (lastAtIndex !== -1) {
      const searchTerm = value.slice(lastAtIndex + 1);
      setMentionSearch(searchTerm);
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  }, []);

  // ✅ FIXED: Memoize mention insertion
  const insertMention = useCallback((username: string) => {
    const lastAtIndex = newMessage.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeMention = newMessage.slice(0, lastAtIndex);
      const afterMention = newMessage.slice(lastAtIndex + mentionSearch.length + 1);
      setNewMessage(`${beforeMention}@${username} ${afterMention}`);
    } else {
      setNewMessage(prev => `${prev}@${username} `);
    }
    setShowMentions(false);
    inputRef.current?.focus();
  }, [newMessage, mentionSearch]);

  // ✅ FIXED: Memoize emoji insertion
  const insertEmoji = useCallback((emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  }, []);

  // ✅ FIXED: Memoize send handler
  const handleSend = useCallback(() => {
    if (!newMessage.trim() || !isLoggedIn || disabled) {
      return;
    }
    
    if (newMessage.length > maxChars) {
      toast.error(`Message too long, maximum ${maxChars} characters`);
      return;
    }

    onSendMessage(newMessage);
    setNewMessage("");
  }, [newMessage, isLoggedIn, disabled, maxChars, onSendMessage]);

  // ✅ FIXED: Memoize display name function
  const getDisplayName = useCallback((profile: any) => {
    return profile?.display_name || 
           profile?.name || 
           profile?.nip05?.split('@')[0] || 
           'Unknown User';
  }, []);

  // ✅ FIXED: Memoize mock users to prevent re-creation
  const mockUsers = useMemo(() => {
    const users = [
      { username: "satoshi", display: "Satoshi Nakamoto", pubkey: "npub1..." },
      { username: "hal", display: "Hal Finney", pubkey: "npub2..." },
      { username: "nick", display: "Nick Szabo", pubkey: "npub3..." },
      { username: "adam", display: "Adam Back", pubkey: "npub4..." },
    ];
    
    return users.filter(user => 
      user.username.toLowerCase().includes(mentionSearch.toLowerCase()) ||
      user.display.toLowerCase().includes(mentionSearch.toLowerCase())
    );
  }, [mentionSearch]);

  // ✅ FIXED: Memoize key down handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === 'Escape') {
      setShowMentions(false);
      if (onClearReply) onClearReply();
    }
  }, [showMentions, handleSend, onClearReply]);

  // ✅ FIXED: Memoize emoji grid to prevent re-renders
  const emojiGrid = useMemo(() => {
    return Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
      <div key={category}>
        <h4 className="text-xs font-medium text-muted-foreground mb-2">{category}</h4>
        <div className="grid grid-cols-8 gap-1">
          {emojis.map(emoji => (
            <button
              key={emoji}
              onClick={() => insertEmoji(emoji)}
              className="p-1 hover:bg-accent rounded text-lg transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    ));
  }, [insertEmoji]);

  if (!isLoggedIn) {
    return (
      <div className="p-4 border-t border-primary/10 bg-gradient-to-r from-muted/30 to-muted/20">
        <div className="bg-muted/50 rounded-xl p-3 text-center backdrop-blur-sm border border-border/50">
          <p className="text-sm text-muted-foreground">
            🔐 Login to join the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-background via-background to-primary/5">
      {/* Enhanced reply indicator */}
      {replyToMessage && (
        <div className="mb-3 p-3 bg-muted/30 rounded-lg border border-primary/20 flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={replyToMessage.profile?.picture || replyToMessage.profile?.image || ''} 
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {(!replyToMessage.profile?.picture && !replyToMessage.profile?.image) && (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                  {getDisplayName(replyToMessage.profile).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-medium">Replying to</span>
                <span className="text-xs font-semibold text-foreground">
                  {getDisplayName(replyToMessage.profile)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground/80 truncate">
                {replyToMessage.content}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearReply}
            className="h-6 w-6 p-0 hover:bg-destructive/20 flex-shrink-0 ml-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-3">
        {/* ✅ FIXED: Memoized Emoji picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-accent border border-border/50"
              disabled={disabled}
            >
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" side="top">
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {emojiGrid}
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="relative flex-1">
          {/* Mention suggestions */}
          {showMentions && mockUsers.length > 0 && (
            <div className="absolute bottom-full mb-2 w-full bg-background border border-border rounded-lg shadow-lg z-10 max-h-32 overflow-y-auto">
              {mockUsers.map(user => (
                <button
                  key={user.username}
                  onClick={() => insertMention(user.username)}
                  className="w-full p-2 text-left hover:bg-accent flex items-center gap-2 transition-colors"
                >
                  <AtSign className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{user.username}</span>
                  <span className="text-muted-foreground text-sm">{user.display}</span>
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <Input
              ref={inputRef}
              placeholder={disabled ? "Disconnected from relays..." : replyToMessage ? "Reply to message..." : "Send a message... (use @ to mention)"}
              value={newMessage}
              onChange={handleInputChange}
              maxLength={maxChars * 2}
              className="rounded-xl pr-20 h-12 bg-background/50 border-border/50 backdrop-blur-sm focus:border-primary/50 transition-all"
              onKeyDown={handleKeyDown}
              disabled={disabled}
            />
            
            <div className="absolute right-1 top-1 flex items-center gap-1">
              <Badge 
                variant={newMessage.length > maxChars ? "destructive" : "secondary"}
                className="text-xs h-6"
              >
                {newMessage.length}/{maxChars}
              </Badge>
              <Button 
                onClick={handleSend} 
                disabled={!newMessage.trim() || newMessage.length > maxChars || disabled}
                size="sm"
                className="h-10 w-10 p-0 rounded-xl shadow-sm"
                variant={disabled ? "outline" : "default"}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {disabled && (
        <p className="text-xs text-muted-foreground text-center mt-2 bg-destructive/10 rounded-lg p-2 border border-destructive/20">
          ⚠️ Disconnected from relays - reconnecting...
        </p>
      )}
    </div>
  );
});

// ✅ FIXED: Add display name for debugging
ChatInput.displayName = 'ChatInput';

export default ChatInput;

