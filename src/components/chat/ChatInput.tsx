
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoggedIn: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoggedIn }) => {
  const [newComment, setNewComment] = useState("");
  
  const handleSendComment = () => {
    if (!newComment.trim()) return;
    onSendMessage(newComment);
    setNewComment("");
  };
  
  if (!isLoggedIn) {
    return (
      <div className="border-t p-3">
        <p className="text-center text-sm text-muted-foreground">
          Login to leave a comment
        </p>
      </div>
    );
  }
  
  return (
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
  );
};

export default ChatInput;
