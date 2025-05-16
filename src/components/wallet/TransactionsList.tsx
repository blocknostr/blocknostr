
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink } from "lucide-react";
import { getAddressTransactions } from "@/lib/api/alephiumApi";
import { toast } from "sonner";

interface TransactionsListProps {
  address: string;
}

interface Transaction {
  hash: string;
  blockHash: string;
  timestamp: number;
  inputs: Array<{
    address: string;
    amount: string;
  }>;
  outputs: Array<{
    address: string;
    amount: string;
  }>;
}

const TransactionsList = ({ address }: TransactionsListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const result = await getAddressTransactions(address);
        setTransactions(result);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        toast.error("Could not fetch transaction history", {
          description: "Using sample data instead"
        });
        
        setTransactions([{
          hash: "0x123456789abcdef",
          blockHash: "0xblockhashabcdef",
          timestamp: Date.now() - 3600000,
          inputs: [{ address: "0xabcdef123456789", amount: "100000000000000000" }],
          outputs: [{ address: address, amount: "100000000000000000" }]
        }]);
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
  
  // Helper to determine if transaction is incoming or outgoing
  const getTransactionType = (tx: Transaction) => {
    // If any output is to this address, it's incoming
    const isIncoming = tx.outputs.some(output => output.address === address);
    // If any input is from this address, it's outgoing
    const isOutgoing = tx.inputs.some(input => input.address === address);
    
    if (isIncoming && !isOutgoing) return 'received';
    if (isOutgoing) return 'sent';
    return 'unknown';
  };
  
  // Calculate amount transferred to/from this address
  const getTransactionAmount = (tx: Transaction) => {
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // Sum all outputs to this address
      const amount = tx.outputs
        .filter(output => output.address === address)
        .reduce((sum, output) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    } else if (type === 'sent') {
      // This is a simplification - for accurate accounting we'd need to track change outputs
      const amount = tx.outputs
        .filter(output => output.address !== address)
        .reduce((sum, output) => sum + Number(output.amount), 0);
      return amount / 10**18; // Convert from nanoALPH to ALPH
    }
    
    return 0;
  };
  
  // Get the counterparty address
  const getCounterpartyAddress = (tx: Transaction) => {
    const type = getTransactionType(tx);
    
    if (type === 'received') {
      // The first input address is usually the sender
      return tx.inputs[0]?.address || 'Unknown';
    } else if (type === 'sent') {
      // The first non-self output is usually the recipient
      const recipient = tx.outputs.find(output => output.address !== address);
      return recipient?.address || 'Unknown';
    }
    
    return 'Unknown';
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
              {transactions.map((tx) => {
                const type = getTransactionType(tx);
                const amount = getTransactionAmount(tx);
                const counterparty = getCounterpartyAddress(tx);
                
                return (
                  <TableRow key={tx.hash}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {type === 'received' ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="capitalize">{type}</span>
                      </div>
                    </TableCell>
                    <TableCell className={type === 'received' ? 'text-green-500' : 'text-blue-500'}>
                      {type === 'received' ? '+' : '-'} {amount.toFixed(4)} ALPH
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{truncateAddress(counterparty)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(tx.timestamp)}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
