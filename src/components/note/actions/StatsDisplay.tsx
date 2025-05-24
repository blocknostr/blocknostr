
interface StatsDisplayProps {
  likeCount: number;
  repostCount: number;
  replyCount: number;
  zapCount: number;
  zapAmount: number;
}

const StatsDisplay = ({ 
  likeCount, 
  repostCount, 
  replyCount, 
  zapCount, 
  zapAmount 
}: StatsDisplayProps) => {
  return (
    <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-muted-foreground">Likes</div>
          <div className="font-medium">{likeCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Reposts</div>
          <div className="font-medium">{repostCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Replies</div>
          <div className="font-medium">{replyCount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Zaps</div>
          <div className="font-medium">
            {zapCount} {zapAmount > 0 && `(${zapAmount.toLocaleString()} sats)`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDisplay;
