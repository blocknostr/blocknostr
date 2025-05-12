
import { NostrEvent } from '@/lib/nostr';
import NoteCard from './note/NoteCard';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface FollowingFeedProps {
  events: NostrEvent[];
  loading: boolean;
  error: string;
  refreshFeed: () => void;
  profiles?: Record<string, any>;
  repostData?: Record<string, any>;
  loadMoreRef?: React.RefObject<HTMLDivElement>;
  following?: string[];
  lastUpdated?: Date;
  cacheHit?: boolean;
  loadingFromCache?: boolean;
}

const FollowingFeed = ({ 
  events, 
  loading, 
  error, 
  refreshFeed,
  profiles = {},
  repostData = {},
  loadMoreRef,
  following = [],
  lastUpdated,
  cacheHit = false,
  loadingFromCache = false
}: FollowingFeedProps) => {
  const handleRefresh = () => {
    refreshFeed();
  };
  
  // Display messages for different states
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="link" 
            className="p-0 h-auto ml-2" 
            onClick={handleRefresh}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Following</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {following.length === 0 && !loading && (
        <div className="bg-muted/30 p-6 rounded-md text-center">
          <p className="text-muted-foreground mb-2">You're not following anyone yet</p>
          <p className="text-sm">Start following users to see their posts here</p>
        </div>
      )}
      
      {events.length === 0 && following.length > 0 && !loading && (
        <div className="bg-muted/30 p-6 rounded-md text-center">
          <p className="text-muted-foreground">No posts from people you follow yet</p>
        </div>
      )}
      
      {events.map((event) => (
        <NoteCard 
          key={event.id} 
          event={event} 
          profileData={profiles[event.pubkey]}
        />
      ))}
      
      {loading && (
        <div className="flex justify-center p-4">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      
      {/* Load more reference element */}
      {loadMoreRef && <div ref={loadMoreRef} className="h-4" />}
    </div>
  );
};

export default FollowingFeed;
