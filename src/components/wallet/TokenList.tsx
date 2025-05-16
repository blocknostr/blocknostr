
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, HelpCircle, Search, DollarSign } from "lucide-react";
import { getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAlephiumPrice } from "@/lib/api/coingeckoApi";
import { formatCurrency, formatPercentage } from "@/lib/utils/formatters";

interface TokenListProps {
  address: string;
}

const TokenList = ({ address }: TokenListProps) => {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alphPrice, setAlphPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'value'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const [tokenData, priceData] = await Promise.all([
          getAddressTokens(address),
          getAlephiumPrice()
        ]);
        
        // Enhance token data with estimated USD values
        const enhancedTokens = tokenData.map(token => {
          // Estimate token values - ALPH uses real price, others use placeholder
          const price = token.symbol === 'ALPH' ? priceData.price : 0.01;
          
          // Parse and clean the formatted amount
          const amount = parseFloat(token.formattedAmount.replace(/,/g, ''));
          
          // Calculate USD value
          const usdValue = token.isNFT ? priceData.price * 0.1 : amount * price;
          
          return {
            ...token,
            usdValue,
            tokenPrice: price
          };
        });
        
        console.log("Fetched tokens with USD values:", enhancedTokens);
        setTokens(enhancedTokens);
        setAlphPrice(priceData.price);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast.error("Could not fetch token balances", {
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [address]);

  // Filter tokens based on search term
  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tokens based on selected column and direction
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'balance') {
      // Extract numeric value from formattedAmount
      const valueA = parseFloat(a.formattedAmount.replace(/,/g, ''));
      const valueB = parseFloat(b.formattedAmount.replace(/,/g, ''));
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    } else {
      // Sort by USD value
      return sortDirection === 'asc' 
        ? a.usdValue - b.usdValue
        : b.usdValue - a.usdValue;
    }
  });

  const handleSort = (column: 'name' | 'balance' | 'value') => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to descending for value and balance, ascending for name
      setSortBy(column);
      setSortDirection(column === 'name' ? 'asc' : 'desc');
    }
  };

  // Calculate total portfolio value
  const totalValue = tokens.reduce((sum, token) => sum + (token.usdValue || 0), 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Your Alephium tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              Token Balances
              {totalValue > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  (Total: {formatCurrency(totalValue)})
                </span>
              )}
            </CardTitle>
            <CardDescription>Your Alephium tokens</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search tokens..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tokens found in this wallet</div>
        ) : filteredTokens.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tokens match your search</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className={sortBy === 'name' ? 'cursor-pointer underline' : 'cursor-pointer'}
                    onClick={() => handleSort('name')}
                  >
                    Token {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead 
                    className={`text-right ${sortBy === 'balance' ? 'cursor-pointer underline' : 'cursor-pointer'}`}
                    onClick={() => handleSort('balance')}
                  >
                    Balance {sortBy === 'balance' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead 
                    className={`text-right ${sortBy === 'value' ? 'cursor-pointer underline' : 'cursor-pointer'}`}
                    onClick={() => handleSort('value')}
                  >
                    Value {sortBy === 'value' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTokens.map((token) => (
                  <TableRow key={token.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border">
                          <AvatarImage 
                            src={token.logoURI} 
                            alt={token.symbol} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/alephium/token-list/master/logos/unknown.png';
                            }}
                          />
                          <AvatarFallback className="text-xs">
                            {token.symbol.substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm">{token.symbol}</p>
                            {token.symbolOnChain && token.symbolOnChain !== token.symbol && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>On-chain symbol: {token.symbolOnChain}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate max-w-[100px]" title={token.id}>
                            {token.id.substring(0, 8)}...{token.id.substring(token.id.length - 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <p className="font-medium text-sm truncate max-w-[150px]" title={token.name}>
                          {token.name}
                        </p>
                        {token.nameOnChain && token.nameOnChain !== token.name && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>On-chain name: {token.nameOnChain}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {token.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]" title={token.description}>
                          {token.description.substring(0, 35)}{token.description.length > 35 ? '...' : ''}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {token.formattedAmount}
                      {token.isNFT && <span className="text-xs text-muted-foreground ml-1">(NFT)</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{formatCurrency(token.usdValue || 0)}</span>
                      </div>
                      {!token.isNFT && token.tokenPrice > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(token.tokenPrice)} per token
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={`https://explorer.alephium.org/tokens/${token.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-primary hover:underline"
                      >
                        View <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenList;
