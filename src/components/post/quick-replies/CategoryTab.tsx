
import React from 'react';
import { CategoryTabProps } from './types';
import QuickReplyItem from './QuickReplyItem';

const CategoryTab: React.FC<CategoryTabProps> = ({ replies, category, onSelect, onDelete }) => {
  // Sort by usage count if no category is specified
  const filteredReplies = category 
    ? replies.filter(reply => reply.category === category)
    : replies.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)).slice(0, 6);
  
  return (
    <div className="flex flex-wrap gap-2">
      {filteredReplies.map(reply => (
        <QuickReplyItem
          key={reply.id}
          reply={reply}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CategoryTab;
