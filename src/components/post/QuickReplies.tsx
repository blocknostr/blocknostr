import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface QuickRepliesProps {
  eventId: string;
  pubkey: string;
  content: string;
  onReplyAdded: () => void;
  onSelected: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({
  eventId,
  pubkey,
  content,
  onReplyAdded,
  onSelected
}) => {
  const [quickReplies, setQuickReplies] = useState<string[]>([]);

  useEffect(() => {
    // Fetch quick replies from local storage or a default set
    const storedReplies = localStorage.getItem('quickReplies');
    if (storedReplies) {
      setQuickReplies(JSON.parse(storedReplies));
    } else {
      // Default quick replies
      setQuickReplies([
        "Great post!",
        "Interesting thoughts.",
        "I agree with you.",
        "This is helpful.",
        "Thank you for sharing."
      ]);
    }
  }, []);

  const handleReplyClick = (text: string) => {
    onSelected(text);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {quickReplies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => handleReplyClick(reply)}
        >
          {reply}
        </Button>
      ))}
    </div>
  );
};

export default QuickReplies;
