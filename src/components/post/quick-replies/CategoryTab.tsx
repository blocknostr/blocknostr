
import React from 'react';
import { CategoryTabProps } from './types';
import QuickReplyItem from './QuickReplyItem';

const CategoryTab: React.FC<CategoryTabProps> = ({ replies, category, onSelect, onDelete }) => {
  const filteredReplies = category 
    ? replies.filter(reply => reply.category === category)
    : replies.sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);
  
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

