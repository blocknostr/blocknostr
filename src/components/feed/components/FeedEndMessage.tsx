
import React from "react";

interface FeedEndMessageProps {
  visible: boolean;
}

const FeedEndMessage: React.FC<FeedEndMessageProps> = ({ visible }) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="text-center py-8 text-muted-foreground border-t">
      You've reached the end of your feed
    </div>
  );
};

export default FeedEndMessage;
