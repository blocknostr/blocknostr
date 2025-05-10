
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import FollowButton from "@/components/FollowButton";
import { nostrService } from "@/lib/nostr";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

interface TrendingUser {
  pubkey: string;
  score: number;
  mentions: number;
  reactions: number;
  reposts: number;
  metadata?: {
    name?: string;
    picture?: string;
    display_name?: string;
    nip05?: string;
    [key: string]: any;
  };
}

const WhoToFollow = () => {
  const [trendingUsers, setTrendingUsers] = useState<TrendingUser[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('week');
  
  const fetchTrendingUsers = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const users = await nostrService.fetchTrendingUsers({
        limit: 5,
        timeframe
      });
      
      setTrendingUsers(users);
    } catch (error) {
      console.error("Error fetching trending users:", error);
      toast.error("Failed to fetch trending users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    // Reload following state whenever nostrService.publicKey changes
    if (nostrService.publicKey) {
      setFollowing(new Set(nostrService.following));
    } else {
      setFollowing(new Set());
    }
  }, [nostrService.publicKey]);
  
  useEffect(() => {
    fetchTrendingUsers();
  }, [timeframe]);
  
  const handleRefresh = () => {
    fetchTrendingUsers(true);
  };

  const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month') => {
    if (newTimeframe !== timeframe) {
      setTimeframe(newTimeframe);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">Who to follow</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="h-8 w-8"
          title="Refresh suggestions"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="flex justify-between mb-3 text-sm border-b">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-2 py-1 ${timeframe === 'day' ? 'border-b-2 border-primary font-medium' : ''}`}
            onClick={() => handleTimeframeChange('day')}
          >
            Today
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-2 py-1 ${timeframe === 'week' ? 'border-b-2 border-primary font-medium' : ''}`}
            onClick={() => handleTimeframeChange('week')}
          >
            This Week
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`px-2 py-1 ${timeframe === 'month' ? 'border-b-2 border-primary font-medium' : ''}`}
            onClick={() => handleTimeframeChange('month')}
          >
            This Month
          </Button>
        </div>
        
        <div className="space-y-4">
          {loading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16 rounded-full" />
              </div>
            ))
          ) : trendingUsers.length > 0 ? (
            // Show trending users
            trendingUsers.map((user) => {
              // Get display name from metadata
              const name = user.metadata?.name || user.metadata?.display_name || 'Unknown';
              const picture = user.metadata?.picture || '';
              const npub = nostrService.getNpubFromHex(user.pubkey);
              const shortNpub = `${npub.substring(0, 8)}...`;
              const avatarFallback = name.charAt(0).toUpperCase();
              
              return (
                <div key={user.pubkey} className="flex items-center justify-between">
                  <Link 
                    to={`/profile/${user.pubkey}`} 
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <Avatar>
                      <AvatarImage src={picture} />
                      <AvatarFallback>{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{name}</div>
                      <div className="text-sm text-muted-foreground">{shortNpub}</div>
                    </div>
                  </Link>
                  <FollowButton 
                    pubkey={user.pubkey} 
                    className="rounded-full"
                  />
                </div>
              );
            })
          ) : (
            // No users found
            <div className="text-center py-4 text-muted-foreground">
              No trending users found. Try another time period or refresh.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WhoToFollow;
