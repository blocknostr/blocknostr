
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLatestTokenTransactions } from "@/lib/api/alephiumApi";
import { format, formatDistanceToNow } from "date-fns";
import { useTokenData } from "@/hooks/useTokenData";

interface TokenActivityProps {
  className?: string;
  limit?: number;
  walletAddresses?: string[];
}

const TokenActivity: React.FC<TokenActivityProps> = ({
  className,
  limit = 5,
  walletAddresses = []
}) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // Use the enhanced useTokenData hook
  const { tokenData, isLoading, lastUpdated, ownedTokenIds, refreshTokens } = useTokenData(walletAddresses);
  
  // Derive the most recent transactions across all tokens
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  useEffect(() => {
    // Flatten all token transactions into a single array
    const allTransactions = Object.entries(tokenData)
      .flatMap(([tokenId, data]) => 
        data.transactions.map(tx => ({
          ...tx,
          tokenId,
          tokenSymbol: data.symbol,
          tokenName: data.name,
          tokenLogoURI: data.logoURI
        }))
      );
    
    // Sort by timestamp (newest first) and take the latest 'limit'
    const sorted = allTransactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    setRecentTransactions(sorted);
  }, [tokenData, limit]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTokens();
    setRefreshing(false);
  };
  
  // Helper to format timestamp
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
            <CardDescription>
              {walletAddresses.length > 0 
                ? "Recent token transactions from your wallets"
                : "Recent token transactions"}
            </CardDescription>
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
        ) : recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {ownedTokenIds.length > 0 ? 
              "No recent token activity found" :
              "Connect a wallet to see token activity"
            }
          </div>
        ) : (
          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.hash} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  {tx.tokenLogoURI ? (
                    <img 
                      src={tx.tokenLogoURI} 
                      alt={tx.tokenSymbol} 
                      className="h-8 w-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png';
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {tx.tokenSymbol?.substring(0, 2) || '??'}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">
                      {tx.tokenSymbol || tx.tokenId?.slice(0, 6) + '...'}
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
