import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Heart, Share2, Clock, Filter, TrendingUp, Zap, MoreHorizontal, Menu, Grid3X3 } from 'lucide-react';
import MediaGrid from './MediaGrid';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useGetUserEventsQuery, useGetEventAnalyticsQuery } from '@/api/rtk/eventsApi';
import { toast } from '@/lib/toast';

interface ProfileActivityProps {
  pubkey: string;
  limit?: number;
}

const ProfileActivity: React.FC<ProfileActivityProps> = React.memo(({
  pubkey,
  limit = 20
}) => {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('posts');
  const [displayLimit, setDisplayLimit] = useState(limit); // Track how many to display
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // RTK Query hooks for user events and analytics
  const {
    data: userEvents = [],
    isLoading,
    error,
    refetch
  } = useGetUserEventsQuery({
    pubkey,
    limit: Math.max(displayLimit * 2, 50), // Fetch more to account for filtering and pagination
    kinds: [1, 6, 7, 9735] // Text notes, reposts, reactions, zaps
  }, {
    skip: !pubkey
  });

  const {
    data: analytics,
    isLoading: analyticsLoading
  } = useGetEventAnalyticsQuery({
    timeframe: 'month',
    limit: 100
  });

  // Reset displayLimit when pubkey changes
  useEffect(() => {
    setDisplayLimit(limit);
  }, [pubkey, limit]);

  // Memoize expensive timestamp formatting
  const formatTimestamp = useCallback((timestamp: number) => {
    const now = Date.now();
    const eventTime = timestamp * 1000; // Convert to milliseconds
    const diff = now - eventTime;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }, []);

  // Memoize activity type functions
  const getActivityIcon = useCallback((kind: number) => {
    switch (kind) {
      case 1: // Text note
        return <MessageSquare className="h-4 w-4" />;
      case 6: // Repost
        return <Share2 className="h-4 w-4" />;
      case 7: // Reaction
        return <Heart className="h-4 w-4" />;
      case 9735: // Zap
        return <Zap className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  }, []);

  const getActivityColor = useCallback((kind: number) => {
    switch (kind) {
      case 1: // Text note
        return 'text-blue-500';
      case 6: // Repost
        return 'text-green-500';
      case 7: // Reaction
        return 'text-red-500';
      case 9735: // Zap
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  }, []);

  const getActivityType = useCallback((kind: number) => {
    switch (kind) {
      case 1: return 'post';
      case 6: return 'repost';
      case 7: return 'reaction';
      case 9735: return 'zap';
      default: return 'note';
    }
  }, []);

  const getActivityLabel = useCallback((kind: number) => {
    switch (kind) {
      case 1: return 'Post';
      case 6: return 'Repost';
      case 7: return 'Reaction';
      case 9735: return 'Zap';
      default: return 'Note';
    }
  }, []);

  // Memoize filtered events to prevent recalculation on every render
  const filteredEvents = useMemo(() => {
    return userEvents.slice(0, displayLimit);
  }, [userEvents, displayLimit]);

  // Memoize event action handler
  const handleEventAction = useCallback((eventId: string, action: string) => {
    // TODO: Implement event actions (like, repost, reply)
    toast.info(`${action} action for event ${eventId.slice(0, 8)}...`);
  }, []);

  // Memoize render event function
  const renderEvent = useCallback((event: any) => {
    const activityType = getActivityType(event.kind);
    const activityLabel = getActivityLabel(event.kind);
    
    return (
      <Card key={event.id} className="p-4 hover:bg-muted/50 transition-colors w-full max-w-full overflow-hidden">
        <div className="flex gap-3 w-full max-w-full min-w-0">
          <div className="flex-shrink-0">
            {event.author?.picture ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={event.author.picture} alt={event.author.display_name || event.author.name} />
                <AvatarFallback>
                  {(event.author.display_name || event.author.name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className={`mt-1 ${getActivityColor(event.kind)}`}>
                {getActivityIcon(event.kind)}
              </div>
            )}
          </div>
          
          <div className="w-0-flex min-w-0 max-w-full overflow-hidden">
            {/* Header section - fixed width elements */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {activityLabel}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
                <Clock className="h-3 w-3" />
                <span className="whitespace-nowrap">{formatTimestamp(event.created_at)}</span>
              </div>
              {event.author?.verified && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">Verified</Badge>
              )}
            </div>

            {/* Event content - constrained width */}
            <div className="space-y-2 w-full max-w-full overflow-hidden mb-2">
              {event.kind === 6 && (
                <p className="text-sm text-muted-foreground truncate">
                  Reposted a note
                </p>
              )}

              {event.kind === 7 && (
                <p className="text-sm text-muted-foreground truncate">
                  Reacted to a note
                </p>
              )}

              {event.content && (
                <p className="text-sm leading-relaxed break-words overflow-hidden word-break-break-all overflow-wrap-break-word">
                  <span className="line-clamp-3">
                    {event.content.length > 200 
                      ? `${event.content.slice(0, 200)}...` 
                      : event.content}
                  </span>
                </p>
              )}

              {/* Hashtags - constrained width */}
              {event.hashtags && event.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1 overflow-hidden max-w-full">
                  {event.hashtags.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={`${event.id}-hashtag-${index}-${tag}`} variant="outline" className="text-xs flex-shrink-0 max-w-[100px] truncate word-break-break-all">
                      #{tag}
                    </Badge>
                  ))}
                  {event.hashtags.length > 3 && (
                    <Badge key={`${event.id}-more-tags`} variant="outline" className="text-xs flex-shrink-0">
                      +{event.hashtags.length - 3}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Footer section - fixed width layout */}
            <div className="flex items-center justify-between w-full max-w-full overflow-hidden">
              <div className="flex items-center gap-4 text-sm text-muted-foreground min-w-0 flex-1 overflow-hidden max-w-full">
                {event.engagement ? (
                  <>
                    <button 
                      className="flex items-center gap-1 hover:text-red-500 transition-colors flex-shrink-0"
                      onClick={() => handleEventAction(event.id, 'like')}
                    >
                      <Heart className="h-4 w-4" />
                      <span className="min-w-[1ch]">{event.engagement.likes || 0}</span>
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-green-500 transition-colors flex-shrink-0"
                      onClick={() => handleEventAction(event.id, 'repost')}
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="min-w-[1ch]">{event.engagement.reposts || 0}</span>
                    </button>
                    <button 
                      className="flex items-center gap-1 hover:text-blue-500 transition-colors flex-shrink-0"
                      onClick={() => handleEventAction(event.id, 'reply')}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="min-w-[1ch]">{event.engagement.replies || 0}</span>
                    </button>
                    {event.engagement.zaps > 0 && (
                      <div className="flex items-center gap-1 text-yellow-500 flex-shrink-0">
                        <Zap className="h-4 w-4" />
                        <span className="min-w-[1ch]">{event.engagement.zaps}</span>
                      </div>
                    )}
                  </>
                ) : (
                  // Placeholder for consistent spacing when no engagement data
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground/50 flex-shrink-0">
                      <Heart className="h-4 w-4" />
                      <span className="min-w-[1ch]">0</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/50 flex-shrink-0">
                      <Share2 className="h-4 w-4" />
                      <span className="min-w-[1ch]">0</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground/50 flex-shrink-0">
                      <MessageSquare className="h-4 w-4" />
                      <span className="min-w-[1ch]">0</span>
                    </div>
                  </div>
                )}
              </div>
              
              <Button variant="ghost" size="sm" className="flex-shrink-0 w-8 h-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }, [getActivityType, getActivityLabel, getActivityColor, getActivityIcon, formatTimestamp, handleEventAction]);

  // Memoize load more handler
  const handleLoadMore = useCallback(() => {
    if (displayLimit < userEvents.length) {
      setDisplayLimit(prev => prev + limit);
    }
  }, [displayLimit, userEvents.length, limit]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Tab Navigation */}
      <TooltipProvider>
        <TabsList className="w-full grid grid-cols-2 h-12 bg-muted p-1 rounded-md mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger 
                value="posts" 
                className="flex items-center justify-center h-full rounded-sm transition-all"
                style={{
                  backgroundColor: activeTab === 'posts' ? 'white' : 'transparent',
                  color: activeTab === 'posts' ? 'black' : 'inherit',
                  boxShadow: activeTab === 'posts' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                  border: activeTab === 'posts' ? '1px solid rgb(229 231 235)' : 'none'
                }}
              >
                <Menu className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Posts & Activity</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger 
                value="media" 
                className="flex items-center justify-center h-full rounded-sm transition-all"
                style={{
                  backgroundColor: activeTab === 'media' ? 'white' : 'transparent',
                  color: activeTab === 'media' ? 'black' : 'inherit',
                  boxShadow: activeTab === 'media' ? '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)' : 'none',
                  border: activeTab === 'media' ? '1px solid rgb(229 231 235)' : 'none'
                }}
              >
                <Grid3X3 className="h-5 w-5" />
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Media Gallery</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>
      </TooltipProvider>

      {/* Tab Content */}
      <TabsContent value="posts" className="space-y-4 w-full max-w-full overflow-hidden">
      {/* Header with analytics */}
      {analytics && analytics.totalEvents > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{userEvents.length}</span>
              <span className="text-muted-foreground">total events</span>
            </div>
            {analytics.engagementMetrics && analytics.engagementMetrics.averageLikes > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4 text-red-500" />
                <span className="font-medium">{analytics.engagementMetrics.averageLikes.toFixed(1)}</span>
                <span className="text-muted-foreground">avg likes</span>
              </div>
            )}
          </div>
        </div>
      )}



      {/* Activity Timeline */}
      <div className="space-y-3 w-full max-w-full overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 min-h-[400px]">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={`loading-skeleton-${index}`} className="p-4">
                <div className="animate-pulse">
                  <div className="flex gap-3 w-full max-w-full">
                    <div className="flex-shrink-0 w-8">
                      <div className="h-8 w-8 bg-muted rounded-full"></div>
                    </div>
                    <div className="w-0-flex min-w-0 max-w-full overflow-hidden">
                      {/* Header section */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-4 w-16 bg-muted rounded flex-shrink-0"></div>
                        <div className="h-4 w-20 bg-muted rounded flex-shrink-0"></div>
                      </div>
                      {/* Content section */}
                      <div className="space-y-1 mb-2 overflow-hidden">
                        <div className="h-4 w-full bg-muted rounded"></div>
                        <div className="h-4 w-3/4 bg-muted rounded"></div>
                      </div>
                      {/* Hashtags section */}
                      <div className="mb-2 overflow-hidden">
                        <div className="h-4 w-16 bg-muted rounded flex-shrink-0"></div>
                      </div>
                      {/* Footer section */}
                      <div className="flex items-center justify-between w-full max-w-full">
                        <div className="flex gap-4 min-w-0 flex-1 overflow-hidden">
                          <div className="h-4 w-12 bg-muted rounded flex-shrink-0"></div>
                          <div className="h-4 w-12 bg-muted rounded flex-shrink-0"></div>
                          <div className="h-4 w-12 bg-muted rounded flex-shrink-0"></div>
                        </div>
                        <div className="h-8 w-8 bg-muted rounded flex-shrink-0"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="space-y-3 min-h-[400px]">
            {filteredEvents.map(renderEvent)}
          </div>
        ) : (
          <div className="min-h-[400px] flex items-center justify-center">
            <Card className="p-8 text-center max-w-md mx-auto">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No activity yet</h4>
              <p className="text-muted-foreground">
                This user hasn't posted any content yet, or their content hasn't been indexed.
              </p>
            </Card>
          </div>
        )}

        {/* Load more button */}
        {displayLimit < userEvents.length && (
          <div className="flex justify-center pt-6">
            <Button 
              variant="ghost" 
              onClick={handleLoadMore}
              disabled={isLoading || isLoadingMore}
              className="group relative px-8 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-200 hover:bg-muted/50 border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 rounded-full"
            >
              <div className="flex items-center gap-3">
                {isLoading || isLoadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>Load {Math.min(limit, userEvents.length - displayLimit)} more posts</span>
                    <div className="text-xs bg-muted/50 px-2 py-1 rounded-full">
                      {displayLimit} of {userEvents.length}
                    </div>
                  </>
                )}
              </div>
            </Button>
          </div>
        )}

        {/* All content loaded indicator */}
        {!isLoading && userEvents.length > 0 && displayLimit >= userEvents.length && (
          <div className="flex justify-center pt-6">
            <div className="text-sm text-muted-foreground/60 flex items-center gap-2">
              <div className="w-8 h-px bg-muted-foreground/20"></div>
              <span>All {userEvents.length} posts loaded</span>
              <div className="w-8 h-px bg-muted-foreground/20"></div>
            </div>
          </div>
        )}
      </div>

        {/* Error State */}
        {error && (
          <Card className="p-4 border-destructive">
            <div className="text-destructive text-sm break-words">
              Error loading activity: {error.message}
            </div>
          </Card>
        )}
      </TabsContent>

      {/* Media Tab Content */}
      <TabsContent value="media">
        <MediaGrid 
          pubkey={pubkey}
          limit={50}
        />
      </TabsContent>
    </Tabs>
  );
});

ProfileActivity.displayName = 'ProfileActivity';

export default ProfileActivity; 

