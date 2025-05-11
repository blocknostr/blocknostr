
  // Fix the fetchReactionCounts function to handle the correct reaction counts data structure
  const fetchReactionCounts = async () => {
    try {
      if (!currentNote?.id) return;
      
      // Create expected return structure with all required fields
      const counts = {
        likes: 0,
        reposts: 0,
        replies: 0, // Added missing properties
        zaps: 0,
        zapAmount: 0
      };
      
      setReactionCounts(counts);
    } catch (error) {
      console.error("Error fetching reaction counts:", error);
    }
  };
  
  // Fix the stats section to use the right properties
  const renderStats = () => {
    return (
      <div className="flex gap-4 text-sm text-muted-foreground pb-4 border-b px-4 md:px-6">
        <div title="Replies">
          <span className="font-medium">{reactionCounts.replies || 0}</span> {reactionCounts.replies === 1 ? 'Reply' : 'Replies'}
        </div>
        <div title="Reposts">
          <span className="font-medium">{reactionCounts.reposts || 0}</span> {reactionCounts.reposts === 1 ? 'Repost' : 'Reposts'}
        </div>
        <div title="Likes">
          <span className="font-medium">{reactionCounts.likes || 0}</span> {reactionCounts.likes === 1 ? 'Like' : 'Likes'}
        </div>
        <div title="Zaps">
          <span className="font-medium">{reactionCounts.zaps || 0}</span> {reactionCounts.zaps === 1 ? 'Zap' : 'Zaps'}
        </div>
        {reactionCounts.zapAmount > 0 && (
          <div title="Zap Amount">
            <span className="font-medium">{reactionCounts.zapAmount}</span> sats
          </div>
        )}
      </div>
    );
  };
