
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrichedToken, getAddressTokens } from "@/lib/api/alephiumApi";
import { formatCurrency } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { EnrichedTokenWithWallets } from "@/types/wallet";

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
    <Card>
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
        <CardDescription>
          {allTokens ? "Tokens across all tracked wallets" : `Tokens in this wallet`}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {tokens.map((token) => {
            // Cast token to EnrichedTokenWithWallets to access wallets safely
            const tokenWithWallets = token as EnrichedTokenWithWallets;
            const walletCount = tokenWithWallets.wallets?.length || 0;
            
            return (
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
                  <div className="font-medium">{token.name || token.symbol}</div>
                  <div className="text-xs text-muted-foreground">{token.symbol}</div>
                  
                  {walletCount > 0 && (
                    <div className="mt-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs">
                              {walletCount} wallet{walletCount > 1 ? 's' : ''}
                              <Info className="h-3 w-3 ml-1" />
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
                    </div>
                  )}
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
          )})}
        </div>
      </CardContent>
    </Card>
  );
};

export default TokenList;
