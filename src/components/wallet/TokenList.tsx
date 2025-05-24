import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrichedToken, getAddressTokens } from "@/lib/api/alephiumApi";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown } from "lucide-react";
import { EnrichedTokenWithWallets } from "@/types/wallet";
import { isTokenMapped } from "@/lib/api/tokenMappings";

interface TokenListProps {
  address: string;
  allTokens?: EnrichedTokenWithWallets[]; // Updated type to include wallets
}

const TokenList: React.FC<TokenListProps> = ({ address, allTokens }) => {
  const [tokens, setTokens] = useState<EnrichedToken[] | EnrichedTokenWithWallets[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If allTokens is provided, use those instead of fetching for a single address
    if (allTokens && allTokens.length > 0) {
      // Filter out NFTs, they're shown in the NFT gallery
      const sortedTokens = allTokens
        .filter(token => !token.isNFT)
        // Sort by USD value (descending) when available
        .sort((a, b) => {
          // If both have USD values, sort by value
          if (a.usdValue !== undefined && b.usdValue !== undefined) {
            return b.usdValue - a.usdValue;
          }
          // If only one has a USD value, prioritize that one
          if (a.usdValue !== undefined) return -1;
          if (b.usdValue !== undefined) return 1;
          // Otherwise sort by token amount
          const aAmount = Number(a.amount || "0");
          const bAmount = Number(b.amount || "0");
          return bAmount - aAmount;
        });
      
      setTokens(sortedTokens);
      setLoading(false);
      return;
    }

    const fetchTokens = async () => {
      try {
        setLoading(true);
        const tokenData = await getAddressTokens(address);
        // Filter out NFTs, they're shown in the NFT gallery
        setTokens(tokenData.filter(token => !token.isNFT));
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [address, allTokens]);

  // Render loading skeleton
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

  // No tokens found state
  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Your token holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-6 text-muted-foreground">
            No tokens found in tracked wallets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Token Balances</CardTitle>
        <CardDescription className="text-sm">
          {allTokens ? "Tokens across all tracked wallets" : `Tokens in this wallet`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 flex-grow overflow-hidden">
        <div className="divide-y max-h-80 overflow-y-auto">
          {tokens.map((token) => {
            // Cast token to EnrichedTokenWithWallets to access wallets safely
            const tokenWithWallets = token as EnrichedTokenWithWallets;
            const walletCount = tokenWithWallets.wallets?.length || 0;
            const hasUsdValue = tokenWithWallets.usdValue !== undefined;
            const isPriceFromMarket = tokenWithWallets.priceSource === 'market';
            const isTokenTracked = isTokenMapped(token.id);
            
            return (
              <div key={token.id} className="p-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="relative">
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
                            {token.symbol?.substring(0, 2) || '??'}
                          </span>
                        </div>
                      )}
                    </div>
                  
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium truncate">{token.name || token.symbol}</div>
                        {isTokenTracked && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="px-1 py-0 h-4 text-[10px] bg-green-500/10 text-green-700 border-green-200">
                                  tracked
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-xs">This token's price is tracked in real-time via CoinGecko</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">{token.symbol}</div>
                        {walletCount > 0 && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {walletCount} wallet{walletCount > 1 ? 's' : ''}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Found in {walletCount} tracked wallet{walletCount > 1 ? 's' : ''}</p>
                                {walletCount > 1 && tokenWithWallets.wallets && (
                                  <div className="mt-2 text-xs">
                                    <div className="font-medium">Distribution:</div>
                                    <div className="max-h-32 overflow-y-auto">
                                      {tokenWithWallets.wallets.map((wallet, idx) => (
                                        <div key={idx} className="flex justify-between mt-1">
                                          <div className="truncate max-w-32 mr-4">
                                            {wallet.address.substring(0, 6)}...{wallet.address.substring(wallet.address.length - 4)}
                                          </div>
                                          <div>
                                            {(Number(wallet.amount) / 10**token.decimals).toLocaleString(
                                              undefined, 
                                              { minimumFractionDigits: 0, maximumFractionDigits: token.decimals }
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-sm">{token.formattedAmount}</div>
                    {hasUsdValue && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`text-xs flex items-center justify-end ${
                              isPriceFromMarket ? 'text-green-600' : 'text-muted-foreground'
                            }`}>
                              {formatCurrency(tokenWithWallets.usdValue)}
                              {!isPriceFromMarket && <Info className="h-3 w-3 ml-1 opacity-70" />}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            {isPriceFromMarket ? (
                              <p className="text-xs">Price from CoinGecko market data</p>
                            ) : (
                              <p className="text-xs">Estimated value (not based on market data)</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenList;
