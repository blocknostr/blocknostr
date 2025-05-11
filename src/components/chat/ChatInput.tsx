
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Smile } from "lucide-react";
import { toast } from "sonner";
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
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "👏", "🙏", "🔥"];

const ChatInput: React.FC<ChatInputProps> = ({ isLoggedIn, maxChars, onSendMessage, disabled = false }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!newMessage.trim() || !isLoggedIn || disabled) {
      return;
    }
    
    if (newMessage.length > maxChars) {
      toast.error(`Message too long, maximum ${maxChars} characters`);
      return;
    }

    onSendMessage(newMessage);
    setNewMessage("");
    setIsTyping(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setIsTyping(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="border-t p-2">
        <p className="text-xs text-center text-muted-foreground p-1">
          Login to join the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="border-t p-2">
      <div className="flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 rounded-full"
              disabled={disabled}
            >
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1 flex-wrap">
              {COMMON_EMOJIS.map(emoji => (
                <Button 
                  key={emoji} 
                  variant="ghost" 
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEmojiSelect(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Input
          placeholder={disabled ? "Disconnected from relays..." : "Send a message..."}
          value={newMessage}
          onChange={handleChange}
          maxLength={maxChars * 2} // Allow typing past limit but show warning
          className="text-xs h-8 rounded-full bg-muted/50"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={disabled}
        />
        
        <div className="flex items-center gap-1">
          <span className={`text-[10px] ${newMessage.length > maxChars ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            {newMessage.length}/{maxChars}
          </span>
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || newMessage.length > maxChars || disabled}
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            variant={disabled ? "outline" : "default"}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {isTyping && isLoggedIn && !disabled && (
        <p className="text-[10px] text-muted-foreground mt-1 ml-1">
          You are typing...
        </p>
      )}
      
      {disabled && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Reconnect to relays to send messages
        </p>
      )}
    </div>
  );
};

export default ChatInput;
