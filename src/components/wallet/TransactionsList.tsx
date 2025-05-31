import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Search, ArrowDownUp, ArrowRightLeft, RefreshCw } from "lucide-react";
import { getAddressTransactions } from "@/api/external/cachedAlephiumApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { truncateAddress } from "@/lib/utils/formatters";
import { 
  getTransactionType,
  getTransactionAmountForDisplay,
  getCounterpartyAddress,
  debugTransactionWithOfficialLogic
} from "@/lib/utils/officialTransactionParser";

interface TransactionsListProps {
  address: string;
  updateApiStatus?: (isLive: boolean, healthUpdate?: any, errorUpdate?: any) => void;
  apiHealth?: any;
}

interface Transaction {
  hash: string;
  blockHash: string;
  timestamp: number;
  inputs: Array<{
    address?: string;
    outputRef?: {
      hint: number;
      key: string;
    };
    unlockScript?: string;
    txHashRef?: string;
    attoAlphAmount?: string;
    amount?: string;
  }>;
  outputs: Array<{
    address: string;
    attoAlphAmount?: string;
    amount?: string;
    hint?: number;
    key?: string;
    tokens?: Array<{
      id: string;
      amount: string;
    }>;
  }>;
  gasAmount?: number;
  gasPrice?: string;
}

const TransactionsList = ({ address, updateApiStatus, apiHealth }: TransactionsListProps) => {
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
        console.log("[TransactionsList] Fetched transactions:", result?.length, "transactions");
        
        setTransactions(result || []);
        
        // Update API status if callback provided
        if (updateApiStatus) {
          updateApiStatus(true, { source: 'explorer' }, {});
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        
        // Update API status with error if callback provided
        if (updateApiStatus) {
          updateApiStatus(false, { source: 'error' }, { network: error instanceof Error ? error.message : 'Failed to fetch transactions' });
        }
        
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
  
  // Use official Alephium Explorer transaction parsing logic
  const parseTransactionForAddress = (tx: Transaction) => {
    // Debug specific transactions
    if (tx.hash && (tx.hash.includes('f45c80') || process.env.NODE_ENV === 'development')) {
      debugTransactionWithOfficialLogic(address, tx);
    }
    
    return {
      type: getTransactionType(address, tx),
      amount: getTransactionAmountForDisplay(address, tx),
      counterparty: getCounterpartyAddress(address, tx)
    };
  };

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(tx => {
    const parsed = parseTransactionForAddress(tx);
    
    return (
      tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parsed.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parsed.type.toLowerCase().includes(searchTerm.toLowerCase())
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

  // Debug helper function for testing specific transactions with official parser
  const debugTransactionClassification = (hash: string) => {
    const tx = transactions.find(t => t.hash === hash);
    if (tx) {
      console.log(`\n=== DEBUGGING TRANSACTION ${hash} (OFFICIAL PARSER) ===`);
      const parsed = parseTransactionForAddress(tx);
      
      console.log(`Final Classification: ${parsed.type.toUpperCase()}`);
      console.log(`Amount: ${parsed.amount.toFixed(4)} ALPH`);
      console.log(`Counterparty: ${parsed.counterparty}`);
      console.log(`Raw Transaction:`, tx);
      console.log(`=== END DEBUG ===\n`);
      
      return parsed;
    } else {
      console.log(`Transaction ${hash} not found in current list`);
      return null;
    }
  };

  // Expose debug function to window for testing (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugTransaction = debugTransactionClassification;
      (window as any).allTransactions = transactions;
    }
  }, [transactions]);

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
                  const parsed = parseTransactionForAddress(tx);
                  const { type, amount, counterparty } = parsed;
                  
                  return (
                    <TableRow key={tx.hash} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {type === 'received' ? (
                            <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/20">
                              <ArrowDownLeft className="h-3.5 w-3.5 text-green-500" />
                            </div>
                          ) : type === 'swap' ? (
                            <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/20">
                              <ArrowRightLeft className="h-3.5 w-3.5 text-purple-500" />
                            </div>
                          ) : type === 'internal' ? (
                            <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-900/20">
                              <RefreshCw className="h-3.5 w-3.5 text-orange-500" />
                            </div>
                          ) : (
                            <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/20">
                              <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                            </div>
                          )}
                          <span className="capitalize">{type}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${
                        type === 'received' ? 'text-green-500' : 
                        type === 'swap' ? 'text-purple-500' : 
                        type === 'internal' ? 'text-orange-500' : 
                        'text-blue-500'
                      }`}>
                        {type === 'received' ? '+' : 
                         type === 'swap' ? '±' : 
                         type === 'internal' ? '↻' : 
                         '-'} {amount.toFixed(4)} ALPH
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

