
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { QuickReplyItemProps } from './types';

const QuickReplyItem: React.FC<QuickReplyItemProps> = ({ reply, onSelect, onDelete }) => {
  const displayText = reply.text.length > 30 ? `${reply.text.substring(0, 30)}...` : reply.text;
  
  return (
    <div className="relative group">
      <Badge 
        variant="outline"
        className="cursor-pointer hover:bg-accent"
        onClick={() => onSelect(reply.text)}
      >
        {displayText}
      </Badge>
      
      {onDelete && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-4 w-4 absolute -top-1 -right-1 rounded-full bg-background text-muted-foreground hidden group-hover:flex"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(reply.id);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default QuickReplyItem;

