
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Lock, Smile, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { nostrService } from "@/lib/nostr";

interface ChatInputProps {
  isLoggedIn: boolean;
  maxChars: number;
  onSendMessage: (content: string) => Promise<string | null>;
  disabled?: boolean;
}

const ChatInput = ({ isLoggedIn, maxChars, onSendMessage, disabled }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const remainingChars = maxChars - message.length;

  // If user logs in, focus the input
  useEffect(() => {
    if (isLoggedIn && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoggedIn]);

  const handleSend = async () => {
    if (!message.trim() || isSending) return;
    
    if (!isLoggedIn) {
      toast.error("You must be signed in to send messages");
      
      // Prompt login after a short delay
      setTimeout(() => {
        toast.info("Sign in to participate", {
          action: {
            label: "Sign In",
            onClick: () => nostrService.login()
          }
        });
      }, 500);
      return;
    }
    
    if (message.length > maxChars) {
      toast.error(`Message too long (max ${maxChars} characters)`);
      return;
    }
    
    setIsSending(true);
    
    try {
      // Call the onSendMessage prop and check the result
      const messageId = await onSendMessage(message);
      
      // Only clear message if sent successfully
      if (messageId) {
        setMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-2 border-t bg-background flex gap-2 items-center">
      {!isLoggedIn ? (
        <div className="flex-1 bg-muted/50 rounded-md px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-muted-foreground">Login to send messages</span>
          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      ) : (
        <>
          <Input
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            maxLength={maxChars + 10} // Allow some buffer over the limit
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={disabled || isSending}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  disabled
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Reactions coming soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button
            onClick={handleSend}
            size="icon"
            className="h-8 w-8"
            disabled={!message.trim() || message.length > maxChars || disabled || isSending}
          >
            {isSending ? (
              <div className="h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
          
          {message.length > 0 && (
            <div className={`text-xs ${remainingChars < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {remainingChars}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatInput;
