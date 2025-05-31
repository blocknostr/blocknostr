import React from "react";
import UnifiedContentViewer from "../UnifiedContentViewer";

/**
 * ArticleViewPage - Now uses UnifiedContentViewer with article-specific configuration
 */
const ArticleViewPage: React.FC = () => {
  return (
    <UnifiedContentViewer
      contentType="article"
      layoutType="container"
      showRelatedContent={true}
      backPath="/articles"
      backLabel="Back to Articles"
    />
  );
};

export default ArticleViewPage;

