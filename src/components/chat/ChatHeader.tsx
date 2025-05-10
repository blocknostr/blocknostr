
import React from "react";

interface ChatHeaderProps {
  title?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  return (
    <div className="border-b px-4 py-3">
      <h2 className="text-lg font-semibold">
        {title || "Chat"}
      </h2>
    </div>
  );
};

export default ChatHeader;
