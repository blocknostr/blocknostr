
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, HelpCircle } from "lucide-react";
import { getAddressTokens, EnrichedToken } from "@/lib/api/alephiumApi";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

interface TokenListProps {
  address: string;
}

const TokenList = ({ address }: TokenListProps) => {
  const [tokens, setTokens] = useState<EnrichedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (tokens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Balances</CardTitle>
          <CardDescription>Your Alephium tokens</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-muted-foreground">No tokens found in this wallet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Balances</CardTitle>
        <CardDescription>Your Alephium tokens</CardDescription>
      </CardHeader>
      <CardContent>
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
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
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
      </CardContent>
    </Card>
  );
};

export default TokenList;
