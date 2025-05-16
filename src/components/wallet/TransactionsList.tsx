
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Search, ArrowDownUp } from "lucide-react";
import { getAddressTransactions } from "@/lib/api/alephiumApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { truncateAddress } from "@/lib/utils/formatters";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!address) return;
      
      setIsLoading(true);
      
      try {
        const result = await getAddressTransactions(address, 100);
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

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(tx => {
    const counterparty = getCounterpartyAddress(tx);
    const txType = getTransactionType(tx);
    
    return (
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return sortDirection === "desc" ? timeB - timeA : timeA - timeB;
  });

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "desc" ? "asc" : "desc");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>Recent activity on your wallet</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? "No transactions match your search" : "No transactions found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Address</TableHead>
                  <TableHead className="hidden md:table-cell">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={toggleSortDirection}
                      className="p-0 h-auto font-medium flex items-center gap-1 hover:no-underline"
                    >
                      Date
                      <ArrowDownUp className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTransactions.map((tx) => {
                  const type = getTransactionType(tx);
                  const amount = getTransactionAmount(tx);
                  const counterparty = getCounterpartyAddress(tx);
                  
                  return (
                    <TableRow key={tx.hash} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {type === 'received' ? (
                            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/20">
                              <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/20">
                              <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                          )}
                          <span className="capitalize">{type}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${type === 'received' ? 'text-green-500' : 'text-blue-500'}`}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionsList;
