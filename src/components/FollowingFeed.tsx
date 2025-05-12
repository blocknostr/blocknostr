
import React from 'react';

export interface FollowingFeedProps {
  activeHashtag?: string;
}

const FollowingFeed: React.FC<FollowingFeedProps> = ({ activeHashtag }) => {
  return (
    <div>
      {activeHashtag ? (
        <div>Filtered Following Feed with #{activeHashtag}</div>
      ) : (
        <div>Following Feed</div>
      )}
    </div>
  );
};

export default FollowingFeed;
