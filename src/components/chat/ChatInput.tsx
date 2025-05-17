
import React, { useState } from "react";
import { SendHorizontal, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  isLoggedIn: boolean;
  maxChars: number;
  onSendMessage: (message: string) => Promise<boolean>;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  isLoggedIn, 
  maxChars, 
  onSendMessage, 
  disabled = false,
  placeholder = "Type your message..."
}) => {
  const [message, setMessage] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  
  // Character count
  const charCount = message.length;
  const isOverLimit = charCount > maxChars;
  
  // Handle text changes with auto-growing height
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };
  
  // Handle sending message
  const handleSend = async () => {
    if (!message.trim() || sending || isOverLimit || !isLoggedIn) return;
    
    setSending(true);
    try {
      const success = await onSendMessage(message);
      if (success) {
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };
  
  // Handle key press (send on Enter, new line on Shift+Enter)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  // If not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="px-4 py-3 border-t flex items-center justify-between bg-background/50 text-muted-foreground">
        <div className="flex items-center justify-center w-full py-2">
          <Lock className="h-3.5 w-3.5 mr-2" />
          <span className="text-sm">Login to participate in the chat</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t flex flex-col bg-background/60">
      <div className="relative">
        <Textarea
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className={cn(
            "resize-none pr-12 py-3 h-[42px] max-h-32 min-h-[42px] text-sm rounded-md overflow-y-auto focus-visible:ring-1",
            isOverLimit && "border-red-500 focus-visible:ring-red-500"
          )}
          disabled={disabled || sending}
          rows={1}
        />
        
        <Button
          size="icon"
          className="absolute bottom-1.5 right-1.5 h-8 w-8"
          onClick={handleSend}
          disabled={!message.trim() || sending || isOverLimit || disabled}
        >
          <SendHorizontal className={cn(
            "h-4 w-4",
            sending && "animate-pulse"
          )} />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
      
      {/* Character counter */}
      <div className="flex justify-end mt-1">
        <span className={cn(
          "text-xs",
          isOverLimit ? "text-red-500" : "text-muted-foreground"
        )}>
          {charCount}/{maxChars}
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
