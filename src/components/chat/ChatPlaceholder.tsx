
import React from "react";
import { MessageSquare } from "lucide-react";

const ChatPlaceholder: React.FC = () => {
  return (
    <>
      <div className="flex items-center justify-center flex-1">
        <div className="text-center p-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Select a note to view comments</p>
        </div>
      </div>
      
      <div className="border-t p-3">
        <p className="text-center text-sm text-muted-foreground">
          Select a note to start chatting
        </p>
      </div>
    </>
  );
};

export default ChatPlaceholder;
