
import React from 'react';
import UnifiedContentViewer from './UnifiedContentViewer';

/**
 * PostPage - Now uses UnifiedContentViewer with post-specific configuration
 */
const PostPage: React.FC = () => {
  return (
    <UnifiedContentViewer
      contentType="post"
      layoutType="sidebar"
      showRelatedContent={false}
      backPath="/"
      backLabel="Back"
    />
  );
};

export default PostPage;

