
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface Token {
  id: string;
  amount: string;
}

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  timestamp: number;
  status: 'confirmed' | 'pending';
  address: string;
  tokens?: Token[];
}

interface TransactionsListProps {
  address: string;
}

const TransactionsList = ({ address }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        // Try to fetch transaction data from the Alephium Explorer API
        // Note: The correct endpoint is /transactions/by-address/:address
        const response = await fetch(`https://backend.mainnet.alephium.org/transactions/by-address/${address}?limit=10`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform the data into our transaction format
        const formattedTransactions: Transaction[] = data.slice(0, 10).map((tx: any) => {
          const isSent = tx.inputs && tx.inputs.some((input: any) => input.address === address);
          
          // Extract token information from outputs
          let tokens: Token[] = [];
          
          if (tx.outputs) {
            tx.outputs.forEach((output: any) => {
              if (output.tokens && output.tokens.length > 0) {
                // For tokens going to our address, consider them as part of the transaction
                if (output.address === address) {
                  output.tokens.forEach((token: any) => {
                    tokens.push({
                      id: token.id,
                      amount: token.amount
                    });
                  });
                }
              }
            });
          }
          
          return {
            id: tx.hash || tx.txId,
            type: isSent ? 'sent' : 'received',
            amount: tx.amount || (tx.outputs?.[0]?.amount ?? "0"),
            timestamp: tx.timestamp || Date.now(),
            status: 'confirmed',
            address: isSent 
              ? (tx.outputs?.[0]?.address || 'Unknown') 
              : (tx.inputs?.[0]?.address || 'Unknown'),
            tokens: tokens.length > 0 ? tokens : undefined
          };
        });
        
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        // Show error message
        toast.error("Could not fetch transaction history", {
          description: "Using sample data instead"
        });
        
        // Fallback to mock data if API fails
        const mockTransactions: Transaction[] = [
          {
            id: "0x123456789abcdef",
            type: "received",
            amount: "100000000000000000",
            timestamp: Date.now() - 3600000 * 2,
            status: "confirmed",
            address: "0xabcdef123456789"
          },
          {
            id: "0x987654321fedcba",
            type: "sent",
            amount: "50250000000000000",
            timestamp: Date.now() - 86400000,
            status: "confirmed",
            address: "0x567890abcdef123"
          },
          {
            id: "0xabcdef123456789",
            type: "received",
            amount: "250750000000000000",
            timestamp: Date.now() - 86400000 * 3,
            status: "confirmed",
            address: "0x123abcdef456789",
            tokens: [
              {
                id: "f4ba66a73c735e1866027e8e1e5823fbf294a0b013a675d3a7d9df112f4ebd00",
                amount: "50000000"
              }
            ]
          },
          {
            id: "0x456789abcdef123",
            type: "sent",
            amount: "75500000000000000",
            timestamp: Date.now() - 86400000 * 7,
            status: "confirmed",
            address: "0x789abcdef123456"
          }
        ];
        
        setTransactions(mockTransactions);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [address]);

  // Helper function to format ALPH amount with correct decimal precision
  const formatAmount = (amountStr: string): string => {
    try {
      const amountBigInt = BigInt(amountStr);
      const divisor = BigInt(10 ** 18);
      
      if (amountBigInt === 0n) return "0";
      
      const integerPart = amountBigInt / divisor;
      const fractionalBigInt = amountBigInt % divisor;
      
      if (fractionalBigInt === 0n) {
        return integerPart.toString();
      }
      
      let fractionalStr = fractionalBigInt.toString().padStart(18, '0');
      
      // Remove trailing zeros
      fractionalStr = fractionalStr.replace(/0+$/, '');
      
      // Limit to max 4 decimal places for display
      if (fractionalStr.length > 4) {
        fractionalStr = fractionalStr.slice(0, 4);
      }
      
      return `${integerPart}.${fractionalStr}`;
    } catch (e) {
      console.error("Error formatting ALPH amount:", e);
      return "?";
    }
  };

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper function to truncate address
  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>Recent activity on your wallet</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No transactions found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="hidden sm:table-cell">Address</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {tx.type === 'received' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="capitalize">{tx.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className={tx.type === 'received' ? 'text-green-500' : 'text-blue-500'}>
                    <div>
                      {tx.type === 'received' ? '+' : '-'} {formatAmount(tx.amount)} ALPH
                    </div>
                    
                    {tx.tokens && tx.tokens.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <PlusCircle className="h-3 w-3" />
                        <span>{tx.tokens.length} token{tx.tokens.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{truncateAddress(tx.address)}</TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(tx.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <a
                      href={`https://explorer.alephium.org/transactions/${tx.id}`}
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
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
