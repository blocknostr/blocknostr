
import React, { useState, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, Bell, BellOff } from "lucide-react";
import { 
  fetchTokenTransactions, 
  TokenTransaction, 
  subscribeToTokenTransactions,
  cleanupTokenTransactions
} from "@/lib/api/tokenTransactions";
import { TokenMetadata, getTokenMetadata } from "@/lib/api/tokenMetadata";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils/formatters";

interface TokenTransactionsProps {
  tokenId: string;
  address?: string; // Optional address to filter transactions
}

const TokenTransactions: React.FC<TokenTransactionsProps> = ({ tokenId, address }) => {
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [token, setToken] = useState<TokenMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Function to load transactions
  const loadTransactions = useCallback(async () => {
    if (!tokenId) return;
    
    setIsLoading(true);
    try {
      const txs = await fetchTokenTransactions(tokenId, 1, 25);
      // Filter by address if provided
      const filteredTxs = address 
        ? txs.filter(tx => 
            tx.inputs.some(input => input.address === address) || 
            tx.outputs.some(output => output.address === address)
          )
        : txs;
      
      setTransactions(filteredTxs);
      
      // Get token metadata
      const tokenData = await getTokenMetadata(tokenId);
      setToken(tokenData);
    } catch (error) {
      console.error("Error loading token transactions:", error);
      toast.error("Failed to load token transactions");
    } finally {
      setIsLoading(false);
    }
  }, [tokenId, address]);
  
  // Handle new transaction updates
  const handleNewTransaction = useCallback((tx: TokenTransaction) => {
    // Skip if not relevant to our address filter
    if (address && 
        !tx.inputs.some(input => input.address === address) &&
        !tx.outputs.some(output => output.address === address)) {
      return;
    }
    
    setTransactions(prev => {
      // Avoid duplicates
      if (prev.some(t => t.hash === tx.hash)) return prev;
      return [tx, ...prev];
    });
    
    toast.info(`New ${token?.symbol || 'token'} transaction`, {
      description: `Transaction ${truncateAddress(tx.hash)} received`
    });
  }, [token, address]);
  
  // Subscribe/unsubscribe to real-time updates
  const toggleSubscription = () => {
    if (isSubscribed) {
      setIsSubscribed(false);
      toast.info(`Stopped monitoring ${token?.symbol || tokenId} transactions`);
    } else {
      setIsSubscribed(true);
      toast.info(`Monitoring ${token?.symbol || tokenId} for new transactions`);
    }
  };
  
  // Initial load
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);
  
  // Subscribe to real-time updates when isSubscribed changes
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    if (isSubscribed && tokenId && token) {
      unsubscribe = subscribeToTokenTransactions(
        tokenId,
        token.symbol,
        handleNewTransaction
      );
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isSubscribed, tokenId, token, handleNewTransaction]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTokenTransactions();
    };
  }, []);
  
  if (!tokenId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Transactions</CardTitle>
          <CardDescription>No token selected</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>
            {token ? `${token.symbol} Transactions` : 'Token Transactions'}
          </CardTitle>
          <CardDescription>
            {address 
              ? `Filtered for address ${truncateAddress(address)}`
              : 'Recent token activity'}
          </CardDescription>
        </div>
        <Button
          variant={isSubscribed ? "default" : "outline"}
          size="sm"
          onClick={toggleSubscription}
          className="flex items-center gap-1.5 h-9"
        >
          {isSubscribed ? (
            <>
              <BellOff className="h-3.5 w-3.5" />
              <span>Stop Monitoring</span>
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5" />
              <span>Monitor</span>
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hash</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  // Find token transfers in this transaction
                  const tokenInputs = tx.inputs.flatMap(input => 
                    input.tokens?.filter(t => t.id === tokenId) || []
                  );
                  
                  const tokenOutputs = tx.outputs.flatMap(output => 
                    output.tokens?.filter(t => t.id === tokenId) || []
                  );
                  
                  // Calculate total amount
                  const totalInput = tokenInputs.reduce(
                    (sum, token) => sum + BigInt(token.amount), 
                    BigInt(0)
                  );
                  
                  const totalOutput = tokenOutputs.reduce(
                    (sum, token) => sum + BigInt(token.amount), 
                    BigInt(0)
                  );
                  
                  // Format amount based on token decimals
                  let formattedAmount = "0";
                  if (token) {
                    const amount = totalOutput > totalInput 
                      ? totalOutput - totalInput 
                      : totalInput - totalOutput;
                    
                    formattedAmount = (amount / BigInt(10 ** token.decimals)).toString();
                  }
                  
                  return (
                    <TableRow key={tx.hash} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">
                        {truncateAddress(tx.hash)}
                      </TableCell>
                      <TableCell>{formatDate(tx.timestamp)}</TableCell>
                      <TableCell>
                        {tx.inputs.length > 0 ? (
                          <span className="text-xs font-mono">
                            {truncateAddress(tx.inputs[0].address)}
                            {tx.inputs.length > 1 && (
                              <Badge variant="outline" className="ml-1">
                                +{tx.inputs.length - 1}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.outputs.length > 0 ? (
                          <span className="text-xs font-mono">
                            {truncateAddress(tx.outputs[0].address)}
                            {tx.outputs.length > 1 && (
                              <Badge variant="outline" className="ml-1">
                                +{tx.outputs.length - 1}
                              </Badge>
                            )}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>
                        {formattedAmount} {token?.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`https://explorer.alephium.org/transactions/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          View <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TokenTransactions;
