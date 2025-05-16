
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLatestTokenTransactions } from "@/lib/api/alephiumApi";
import { fetchTokenList } from "@/lib/api/tokenMetadata";
import { format, formatDistanceToNow } from "date-fns";

interface TokenActivityProps {
  className?: string;
  limit?: number;
}

const TokenActivity: React.FC<TokenActivityProps> = ({
  className,
  limit = 5
}) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      // First get token metadata
      const tokens = await fetchTokenList();
      setTokenMetadata(tokens);
      
      // Get token IDs
      const tokenIds = Object.keys(tokens);
      if (tokenIds.length === 0) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Get latest transactions
      const latestTxs = await fetchLatestTokenTransactions(tokenIds, limit);
      setTransactions(latestTxs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching token activity:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchData();
    
    // Set up periodic refresh every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);
  
  const handleRefresh = () => {
    fetchData();
  };
  
  // Helper to get token symbol from token ID
  const getTokenSymbol = (tokenId: string) => {
    return tokenMetadata[tokenId]?.symbol || tokenId.slice(0, 6) + '...';
  };
  
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Token Activity</CardTitle>
            <CardDescription>Recent token transactions</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No recent token activity
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  {tokenMetadata[tx.tokenId]?.logoURI ? (
                    <img 
                      src={tokenMetadata[tx.tokenId].logoURI} 
                      alt={tokenMetadata[tx.tokenId]?.symbol} 
                      className="h-8 w-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png';
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {getTokenSymbol(tx.tokenId).substring(0, 2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">
                      {getTokenSymbol(tx.tokenId)}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {tx.outputs?.length || 0} outputs
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://explorer.alephium.org/transactions/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs flex items-center"
                >
                  View <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </div>
            ))}
            
            {lastUpdated && (
              <div className="text-xs text-muted-foreground text-center pt-2">
                Last updated: {format(lastUpdated, 'HH:mm:ss')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenActivity;
