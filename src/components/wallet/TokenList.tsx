
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink } from "lucide-react";
import { getAddressTokens } from "@/lib/api/alephiumApi";
import { toast } from "sonner";

interface TokenListProps {
  address: string;
}

interface Token {
  id: string;
  amount: number;
  name?: string;
  symbol?: string;
}

const TokenList = ({ address }: TokenListProps) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const tokenData = await getAddressTokens(address);
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
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>
                  <div className="font-medium">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">{token.name}</div>
                </TableCell>
                <TableCell className="text-right font-medium">{token.amount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <a
                    href={`https://explorer.alephium.org/tokens/${token.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:underline"
                  >
                    Details <ExternalLink className="ml-1 h-3 w-3" />
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
