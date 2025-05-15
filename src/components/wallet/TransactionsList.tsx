
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  timestamp: number;
  status: 'confirmed' | 'pending';
  address: string;
  blockHash?: string;
}

interface AlephiumTransactionResponse {
  txId: string;
  blockHash: string;
  timestamp: number;
  inputs: Array<{
    address: string;
    attoAlphAmount: string;
  }>;
  outputs: Array<{
    address: string;
    attoAlphAmount: string;
  }>;
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
        // Fetch transaction data from the Alephium Explorer API
        const response = await fetch(`https://explorer-backend.mainnet.alephium.org/addresses/${address}/transactions?limit=10`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch transactions: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.transactions || !Array.isArray(data.transactions)) {
          throw new Error('Invalid response format');
        }
        
        // Transform the data into our transaction format
        const formattedTransactions: Transaction[] = data.transactions.map((tx: AlephiumTransactionResponse) => {
          // Determine if the transaction is sent or received
          const isSent = tx.inputs.some(input => input.address === address);
          
          // Calculate the total amount
          let amount = '0';
          if (isSent) {
            // For sent, sum the outputs that don't go back to the sender
            const nonSelfOutputs = tx.outputs.filter(output => output.address !== address);
            amount = nonSelfOutputs.reduce((sum, output) => 
              (BigInt(sum) + BigInt(output.attoAlphAmount)).toString(), '0');
          } else {
            // For received, sum outputs that go to the current address
            const selfOutputs = tx.outputs.filter(output => output.address === address);
            amount = selfOutputs.reduce((sum, output) => 
              (BigInt(sum) + BigInt(output.attoAlphAmount)).toString(), '0');
          }
          
          // Format amount to ALPH (1 ALPH = 10^18 attoALPH)
          const formattedAmount = (Number(amount) / 10**18).toString();
          
          return {
            id: tx.txId,
            type: isSent ? 'sent' : 'received',
            amount: formattedAmount,
            timestamp: tx.timestamp,
            status: 'confirmed',
            address: isSent 
              ? (tx.outputs[0]?.address || 'Unknown') 
              : (tx.inputs[0]?.address || 'Unknown'),
            blockHash: tx.blockHash
          };
        });
        
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        // If we're using the fixed demo address, show mock data
        if (address === "raLUPHsewjm1iA2kBzRKXB2ntbj3j4puxbVvsZD8iK3r") {
          const mockTransactions: Transaction[] = [
            {
              id: "0xf67ab1c44630ef4a9e9531a17bded756a1aa2fcd65de998ce785aaf55190588f",
              type: "received",
              amount: "5.00",
              timestamp: Date.now() - 3600000 * 2,
              status: "confirmed",
              address: "0xabcdef123456789"
            },
            {
              id: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
              type: "sent",
              amount: "2.25",
              timestamp: Date.now() - 86400000,
              status: "confirmed",
              address: "0x567890abcdef123"
            },
            {
              id: "0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
              type: "received",
              amount: "1.75",
              timestamp: Date.now() - 86400000 * 3,
              status: "confirmed",
              address: "0x123abcdef456789"
            },
            {
              id: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
              type: "sent",
              amount: "0.50",
              timestamp: Date.now() - 86400000 * 7,
              status: "confirmed",
              address: "0x789abcdef123456"
            }
          ];
          
          setTransactions(mockTransactions);
          toast.info("Using sample transaction data for this demo address", {
            description: "Connect your own wallet to see real transaction history"
          });
        } else {
          toast.error("Could not fetch transaction history", {
            description: "Using sample data instead"
          });
          
          // Fallback to empty state
          setTransactions([]);
        }
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

  // Format amount with appropriate precision
  const formatAmount = (amount: string) => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return "0.00";
    
    return amountNum < 0.0001 
      ? amountNum.toExponential(4) 
      : amountNum.toLocaleString(undefined, { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 4 
        });
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
          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-2">No transactions found</p>
            <p className="text-sm text-muted-foreground">This wallet may be new or has no activity yet</p>
          </div>
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
                      <Badge variant={tx.type === 'received' ? 'outline' : 'secondary'} className="capitalize">
                        {tx.type}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className={tx.type === 'received' ? 'text-green-500' : 'text-blue-500'}>
                    {tx.type === 'received' ? '+' : '-'} {formatAmount(tx.amount)} ALPH
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
