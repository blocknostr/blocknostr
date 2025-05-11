
import React from "react";
import { motion } from "framer-motion";

interface FeedEmptyStateProps {
  following: string[];
  loading: boolean;
  activeHashtag?: string;
}

const FeedEmptyState: React.FC<FeedEmptyStateProps> = ({
  following,
  loading,
  activeHashtag
}) => {
  if (loading && !activeHashtag) {
    return (
      <div className="py-12 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-muted-foreground">Loading posts from people you follow...</span>
        </motion.div>
      </div>
    );
  }

  if (activeHashtag && !loading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="py-12 text-center text-muted-foreground"
      >
        No posts found with <span className="text-primary font-medium">#{activeHashtag}</span> hashtag from people you follow
      </motion.div>
    );
  }

  if (following.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="py-12 text-center bg-secondary/50 rounded-lg p-6"
      >
        <h3 className="text-lg font-medium mb-2">You're not following anyone yet</h3>
        <p className="text-muted-foreground">
          Follow some users to see their posts here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="py-12 text-center bg-secondary/50 rounded-lg p-6"
    >
      <h3 className="text-lg font-medium mb-2">No posts found</h3>
      <p className="text-muted-foreground">
        Try following more users or connecting to more relays.
      </p>
    </motion.div>
  );
};

export default FeedEmptyState;
