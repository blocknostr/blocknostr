
import React, { useEffect, useState } from 'react';
import { useUnifiedProfileFetcher } from '@/hooks/useUnifiedProfileFetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TrendingFilterMenu from './TrendingFilterMenu';
import TrendingTopicsList from './TrendingTopicsList';
import { Skeleton } from "@/components/ui/skeleton";
import { nostrService } from '@/lib/nostr';
import { Link } from 'react-router-dom';
import { Topic } from './types';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import TrendingFilterButton from './TrendingFilterButton';

interface TrendingSectionProps {
  className?: string;
  limit?: number;
  onTopicClick?: (topic: string) => void;
  activeHashtag?: string;
  onClearHashtag?: () => void;
}

const TrendingSection = ({ 
  className, 
  limit = 5,
  onTopicClick,
  activeHashtag,
  onClearHashtag
}: TrendingSectionProps) => {
  const [trendingUsers, setTrendingUsers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profiles, fetchProfiles } = useUnifiedProfileFetcher();
  
  // Mock trending topics data
  const [topics, setTopics] = useState<Topic[]>([
    { name: "bitcoin", posts: "2.5K" },
    { name: "nostr", posts: "1.8K" },
    { name: "alephium", posts: "1.2K" },
    { name: "crypto", posts: "980" },
    { name: "blocknoster", posts: "750" },
    { name: "web3", posts: "620" },
  ]);

  // Fetch trending users and their profiles
  useEffect(() => {
    const fetchTrendingUsers = async () => {
      setIsLoading(true);
      try {
        // This is a simplified implementation
        // In a real app, you'd fetch actual trending users based on activity
        const connectedRelays = await nostrService.getRelayUrls();
        
        // Add some popular relays to get trending data
        const popularRelays = [
          'wss://relay.damus.io',
          'wss://nos.lol',
          'wss://relay.nostr.band'
        ];
        
        // Connect to relays if needed
        await nostrService.connectToUserRelays([...connectedRelays, ...popularRelays]);
        
        // Subscribe to recent notes to find active users
        const subId = nostrService.subscribe(
          [{
            kinds: [1], // Text notes
            limit: 25,
          }],
          (event) => {
            setTrendingUsers(prevUsers => {
              // Add unique pubkeys
              if (!prevUsers.includes(event.pubkey)) {
                return [...prevUsers, event.pubkey].slice(0, limit);
              }
              return prevUsers;
            });
          }
        );
        
        // Set a timeout to ensure we don't wait forever
        setTimeout(() => {
          nostrService.unsubscribe(subId);
          setIsLoading(false);
        }, 5000);
        
      } catch (error) {
        console.error("Error fetching trending users:", error);
        setIsLoading(false);
      }
    };

    fetchTrendingUsers();
  }, [limit]);
  
  // Fetch profiles for trending users when they change
  useEffect(() => {
    if (trendingUsers.length > 0) {
      fetchProfiles(trendingUsers);
    }
  }, [trendingUsers, fetchProfiles]);

  // Handle topic click
  const handleTopicClick = (topic: string) => {
    if (onTopicClick) {
      onTopicClick(topic);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle>Trending</CardTitle>
          <DropdownMenu>
            <TrendingFilterButton />
            <TrendingFilterMenu 
              filterOptions={[]} 
              timeOptions={[]}
              activeFilter="all" 
              timeRange="day" 
              setActiveFilter={() => {}} 
              setTimeRange={() => {}} 
            />
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <TrendingTopicsList 
          topics={topics} 
          onTopicClick={handleTopicClick}
          activeHashtag={activeHashtag}
          onClearHashtag={onClearHashtag}
        />
        
        <div className="pt-4 border-t">
          <h3 className="text-sm font-medium mb-3">Popular Profiles</h3>
          <div className="space-y-3">
            {isLoading ? (
              Array(limit).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : (
              trendingUsers.map(pubkey => {
                const profile = profiles[pubkey];
                const npub = nostrService.getNpubFromHex(pubkey);
                const displayName = profile?.display_name || profile?.name || `nostr:${npub.slice(0, 8)}...`;
                const username = profile?.name || npub.slice(0, 8);
                const avatarFallback = (profile?.display_name || profile?.name || "U").charAt(0).toUpperCase();
                
                return (
                  <Link to={`/profile/${npub}`} key={pubkey} className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-md">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.picture} />
                      <AvatarFallback className="bg-primary/10">{avatarFallback}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{displayName}</div>
                      <div className="text-xs text-muted-foreground">@{username}</div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingSection;
