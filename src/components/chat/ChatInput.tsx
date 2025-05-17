
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Smile } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  isLoggedIn: boolean;
  maxChars: number;
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ isLoggedIn, maxChars, onSendMessage, disabled = false }) => {
  const [newMessage, setNewMessage] = useState("");

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
  };

  if (!isLoggedIn) {
    return (
      <div className="border-t p-3">
        <div className="bg-muted/50 rounded-full p-2 text-center">
          <p className="text-xs text-muted-foreground">
            Login to join the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t p-3">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0 hover:bg-accent"
          disabled={disabled}
        >
          <Smile className="h-5 w-5 text-muted-foreground" />
        </Button>
        
        <div className="relative flex-1">
          <Input
            placeholder={disabled ? "Disconnected from relays..." : "Send a message..."}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            maxLength={maxChars * 2} // Allow typing past limit but show warning
            className="rounded-full pr-16 h-9 bg-muted/30"
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={disabled}
          />
          <div className="absolute right-1 top-1 flex items-center">
            <span className={`text-[10px] mr-1 ${newMessage.length > maxChars ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
              {newMessage.length}/{maxChars}
            </span>
            <Button 
              onClick={handleSend} 
              disabled={!newMessage.trim() || newMessage.length > maxChars || disabled}
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              variant={disabled ? "outline" : "default"}
            >
              <SendHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      {disabled && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">
          Reconnect to relays to send messages
        </p>
      )}
    </div>
  );
};

export default ChatInput;
