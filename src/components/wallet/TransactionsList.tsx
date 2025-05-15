
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  timestamp: number;
  status: 'confirmed' | 'pending';
  address: string;
}

interface TransactionsListProps {
  address: string;
}

const TransactionsList = ({ address }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Format ALPH amount from raw balance with 18 decimal precision
  const formatAlphAmount = (rawAmount: string | number): string => {
    try {
      const decimals = 18; // ALPH uses 18 decimals
      const amount = typeof rawAmount === 'string' ? rawAmount : rawAmount.toString();
      const rawValue = BigInt(amount);
      
      if (rawValue === BigInt(0)) return "0.0000";
      
      const divisor = BigInt(10 ** decimals);
      
      // Calculate whole and fractional parts
      const wholePart = rawValue / divisor;
      const fractionalPart = rawValue % divisor;
      
      // Format the fractional part with proper precision
      let fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      
      // Trim to 4 decimal places for display
      fractionalStr = fractionalStr.slice(0, 4);
      
      // Return the formatted amount
      return `${wholePart.toString()}.${fractionalStr}`;
    } catch (error) {
      console.error('[formatAlphAmount] Error formatting amount:', error);
      return "0.0000";
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        // Updated API endpoint for transactions - using /addresses/{address}/transactions path
        // instead of /transactions/address/{address} which returned 404
        const response = await fetch(`https://backend.mainnet.alephium.org/addresses/${address}/transactions?page=1&limit=10`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[TransactionsList] Raw transactions data:", data);
        
        // Transform the data into our transaction format
        // Note: This transformation handles the actual API response format 
        const formattedTransactions: Transaction[] = (data?.transactions || []).map((tx: any) => {
          // Determine if this is an incoming or outgoing transaction
          const isSent = tx.inputs && tx.inputs.some((input: any) => input.address === address);
          
          // Calculate amount
          let amount = "0";
          if (isSent) {
            // Outgoing transaction - sum outputs not going to our address
            amount = tx.outputs
              .filter((output: any) => output.address !== address)
              .reduce((sum: bigint, output: any) => sum + BigInt(output.amount || 0), BigInt(0))
              .toString();
          } else {
            // Incoming transaction - sum outputs going to our address
            amount = tx.outputs
              .filter((output: any) => output.address === address)
              .reduce((sum: bigint, output: any) => sum + BigInt(output.amount || 0), BigInt(0))
              .toString();
          }
          
          // Convert raw amount to ALPH with correct decimal precision
          const alphAmount = formatAlphAmount(amount);

          return {
            id: tx.hash || tx.txId || tx.transactionHash || "unknown",
            type: isSent ? 'sent' : 'received',
            amount: alphAmount,
            timestamp: tx.timestamp || Date.now(),
            status: 'confirmed',
            address: isSent 
              ? (tx.outputs?.[0]?.address || 'Unknown') 
              : (tx.inputs?.[0]?.address || 'Unknown')
          };
        });
        
        console.log("[TransactionsList] Formatted transactions:", formattedTransactions);
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('[TransactionsList] Error fetching transactions:', error);
        // Fallback to mock data if API fails
        const mockTransactions: Transaction[] = [
          {
            id: "0x123456789abcdef",
            type: "received",
            amount: "100.0000",
            timestamp: Date.now() - 3600000 * 2,
            status: "confirmed",
            address: "0xabcdef123456789"
          },
          {
            id: "0x987654321fedcba",
            type: "sent",
            amount: "50.2500",
            timestamp: Date.now() - 86400000,
            status: "confirmed",
            address: "0x567890abcdef123"
          },
          {
            id: "0xabcdef123456789",
            type: "received",
            amount: "250.7500",
            timestamp: Date.now() - 86400000 * 3,
            status: "confirmed",
            address: "0x123abcdef456789"
          },
          {
            id: "0x456789abcdef123",
            type: "sent",
            amount: "75.5000",
            timestamp: Date.now() - 86400000 * 7,
            status: "confirmed",
            address: "0x789abcdef123456"
          }
        ];
        
        setTransactions(mockTransactions);
        toast.error("Could not fetch transaction history", {
          description: "Using sample data instead"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [address]);

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
                    {tx.type === 'received' ? '+' : '-'} {tx.amount} ALPH
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
