
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrichedToken, getAddressTokens } from "@/lib/api/alephiumApi";
import { formatCurrency } from "@/lib/utils/formatters";
import { BadgeInfo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TokenListProps {
  address: string;
  allTokens?: EnrichedToken[]; // New prop to receive aggregated tokens
  refreshFlag?: number; // Add refreshFlag to trigger refreshes
}

const TokenList: React.FC<TokenListProps> = ({ address, allTokens, refreshFlag = 0 }) => {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If allTokens is provided, use those instead of fetching for a single address
    if (allTokens && allTokens.length > 0) {
      setTokens(allTokens.filter(token => !token.isNFT));
      setLoading(false);
      return;
    }

    const fetchTokens = async () => {
      try {
        setLoading(true);
        const tokenData = await getAddressTokens(address);
        setTokens(tokenData.filter(token => !token.isNFT));
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [address, allTokens, refreshFlag]); // Add refreshFlag to dependencies

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!allTokens) { // Only setup auto-refresh if we're not using passed tokens
      const refreshInterval = setInterval(() => {
        const fetchTokens = async () => {
          try {
            const tokenData = await getAddressTokens(address);
            setTokens(tokenData.filter(token => !token.isNFT));
          } catch (error) {
            console.error('Error refreshing tokens:', error);
          }
        };
        
        fetchTokens();
        console.log("Auto-refreshing token data");
      }, 5 * 60 * 1000); // 5 minutes in milliseconds

      return () => clearInterval(refreshInterval); // Cleanup on unmount
    }
  }, [address, allTokens]);

  // Render loading skeleton or error state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Your token holdings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-1" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Your token holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-muted-foreground">
            No tokens found in this wallet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
        <CardDescription>
          {allTokens ? "Tokens across all tracked wallets" : `Tokens in this wallet`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tokens.map((token) => (
            <div key={token.id} className="flex items-center justify-between p-4">
              <div className="flex items-center">
                {token.logoURI ? (
                  <img 
                    src={token.logoURI} 
                    alt={token.symbol} 
                    className="h-8 w-8 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png';
                    }}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {token.symbol ? token.symbol.substring(0, 2) : '??'}
                    </span>
                  </div>
                )}
                
                <div className="ml-3">
                  <div className="flex items-center">
                    <span className="font-medium">{token.name || token.symbol}</span>
                    {token.nameOnChain && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <BadgeInfo className="h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p>Token ID: {token.id.substring(0, 10)}...</p>
                              {token.description && <p>{token.description}</p>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{token.symbol}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-medium">{token.formattedAmount}</div>
                {token.usdValue ? (
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(token.usdValue)}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenList;
