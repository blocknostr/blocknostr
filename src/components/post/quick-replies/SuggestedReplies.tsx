
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { SuggestedRepliesProps } from './types';

const SuggestedReplies: React.FC<SuggestedRepliesProps> = ({ suggestions, onSelect }) => {
  if (!suggestions.length) return null;
  
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {suggestions.map((text, index) => (
        <Badge 
          key={index} 
          variant="secondary"
          className="cursor-pointer hover:bg-secondary/80"
          onClick={() => onSelect(text)}
        >
          {text}
        </Badge>
      ))}
    </div>
  );
};

export default SuggestedReplies;

