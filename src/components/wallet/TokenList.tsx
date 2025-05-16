
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, HelpCircle, Search } from "lucide-react";
import { getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface TokenListProps {
  address: string;
}

const TokenList = ({ address }: TokenListProps) => {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchTokens = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const tokenData = await getAddressTokens(address);
        console.log("Fetched tokens with formatted amounts:", tokenData);
        setTokens(tokenData);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        toast.error("Could not fetch token balances", {
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTokens();
  }, [address]);

  // Filter tokens based on search term
  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
    token.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort tokens by value (high to low)
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    // Extract numeric value from formattedAmount
    const valueA = parseFloat(a.formattedAmount.replace(/,/g, ''));
    const valueB = parseFloat(b.formattedAmount.replace(/,/g, ''));
    return valueB - valueA;
  });

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
            <CardTitle>Token Balances</CardTitle>
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
                  <TableHead>Token</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
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
