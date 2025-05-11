
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  isLoggedIn: boolean;
  maxChars: number;
  onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ isLoggedIn, maxChars, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (!newMessage.trim() || !isLoggedIn) {
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
        <Input
          placeholder="Send a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          maxLength={maxChars * 2} // Allow typing past limit but show warning
          className="text-xs h-8"
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
        />
        <div className="flex items-center gap-1">
          <span className={`text-[10px] ${newMessage.length > maxChars ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            {newMessage.length}/{maxChars}
          </span>
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim() || newMessage.length > maxChars}
            size="sm"
            className="h-8 w-8 p-0"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
