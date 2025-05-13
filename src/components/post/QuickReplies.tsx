
import React from 'react';
import { QuickRepliesProps } from './quick-replies/types';
import QuickRepliesContainer from './quick-replies/QuickRepliesContainer';

const QuickReplies: React.FC<QuickRepliesProps> = ({ onReplySelected }) => {
  return <QuickRepliesContainer onReplySelected={onReplySelected} />;
};

export default QuickReplies;
