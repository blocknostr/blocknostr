
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Smile, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { nostrService } from "@/lib/nostr";

interface ChatInputProps {
  isLoggedIn: boolean;
  maxChars: number;
  onSendMessage: (message: string) => Promise<string | null>;
  disabled?: boolean;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "👏", "🙏", "🔥"];

const ChatInput: React.FC<ChatInputProps> = ({ isLoggedIn, maxChars, onSendMessage, disabled = false }) => {
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Verify authentication on component mount
  useEffect(() => {
    // Check that the login state and public key are consistent
    const publicKey = nostrService.publicKey;
    const loginStateValid = isLoggedIn === !!publicKey;
    
    console.log("ChatInput: Authentication check");
    console.log("- isLoggedIn prop:", isLoggedIn);
    console.log("- Public key available:", !!publicKey);
    
    if (!loginStateValid) {
      console.warn("ChatInput: Login state inconsistency detected", { 
        isLoggedIn, publicKey 
      });
    }
    
    setAuthChecked(true);
  }, [isLoggedIn]);

  const handleSend = async () => {
    if (!newMessage.trim() || !isLoggedIn || disabled || isSending) {
      return;
    }
    
    if (newMessage.length > maxChars) {
      toast.error(`Message too long, maximum ${maxChars} characters`);
      return;
    }
    
    if (!nostrService.publicKey) {
      console.error("ChatInput: Trying to send message but public key is not available");
      toast.error("Authentication error. Please log in again.");
      return;
    }

    setIsSending(true);
    try {
      console.log("ChatInput: Sending message:", newMessage);
      const result = await onSendMessage(newMessage);
      
      // Fix: Check if result exists instead of treating it as boolean
      if (result !== null) {
        console.log("ChatInput: Message sent successfully with ID:", result);
        setNewMessage("");
        setIsTyping(false);
      } else {
        console.error("ChatInput: Message send failed (null result)");
        toast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("ChatInput: Error sending message:", error);
      toast.error("Error sending message");
    } finally {
      setIsSending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    setIsTyping(e.target.value.length > 0);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setIsTyping(true);
  };
  
  // If authentication is inconsistent, show an error
  if (authChecked && isLoggedIn && !nostrService.publicKey) {
    return (
      <div className="border-t p-2 bg-red-50 dark:bg-red-900/10">
        <div className="flex items-center gap-2 justify-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-xs">Authentication error. Please refresh and login again.</p>
        </div>
      </div>
    );
  }

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
          disabled={disabled || isSending}
        />
        
        <div className="flex items-center gap-1">
          <span className={`text-[10px] ${newMessage.length > maxChars ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            {newMessage.length}/{maxChars}
          </span>
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || newMessage.length > maxChars || disabled || isSending}
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            variant={disabled ? "outline" : "default"}
          >
            <SendHorizontal className={`h-4 w-4 ${isSending ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
      
      {isTyping && isLoggedIn && !disabled && (
        <p className="text-[10px] text-muted-foreground mt-1 ml-1">
          You are typing...
        </p>
      )}
      
      {isSending && (
        <p className="text-[10px] text-primary mt-1 ml-1">
          Sending message...
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
