
import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedSegment } from '../types';

/**
 * Renders a formatted segment based on its type
 */
export const renderSegment = (segment: FormattedSegment, index: number): JSX.Element | null => {
  // Skip rendering segments marked as shouldRender: false
  if (segment.shouldRender === false) {
    return null;
  }
  
  switch (segment.type) {
    case 'mention':
      return (
        <Link 
          key={index} 
          to={`/profile/${segment.data}`}
          className="text-primary font-medium hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          @{segment.data?.substring(0, 8)}
        </Link>
      );
    case 'hashtag':
      return (
        <span 
          key={index} 
          className="text-primary font-medium hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            // Handle hashtag click (implement later)
          }}
        >
          #{segment.data}
        </span>
      );
    case 'url':
      return (
        <a 
          key={index} 
          href={segment.data} 
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {segment.content}
        </a>
      );
    default:
      return <span key={index}>{segment.content}</span>;
  }
};
