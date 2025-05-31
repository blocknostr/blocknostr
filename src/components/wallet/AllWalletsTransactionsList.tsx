import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownLeft, ExternalLink, Search, ArrowDownUp, Wallet, ArrowRightLeft, RefreshCw } from "lucide-react";
import { getAddressTransactions } from "@/api/external/cachedAlephiumApi";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/toast";
import { truncateAddress } from "@/lib/utils/formatters";
import { SavedWallet, WalletType } from "@/api/types/wallet";
import { 
  getTransactionType,
  getTransactionAmountForDisplay,
  getCounterpartyAddress,
  debugTransactionWithOfficialLogic,
  debugZeroTransactions
} from "@/lib/utils/officialTransactionParser";

interface AllWalletsTransactionsListProps {
  savedWallets: SavedWallet[];
  selectedWalletType: WalletType;
  updateApiStatus?: (isLive: boolean, healthUpdate?: any, errorUpdate?: any) => void;
  apiHealth?: any;
}

interface TransactionWithWallet {
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
  // Wallet information
  walletAddress: string;
  walletLabel: string;
}

const AllWalletsTransactionsList = ({ 
  savedWallets, 
  selectedWalletType, 
  updateApiStatus, 
  apiHealth 
}: AllWalletsTransactionsListProps) => {
  const [transactions, setTransactions] = useState<TransactionWithWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Filter wallets for the selected type (memoized to prevent infinite loops)
  const filteredWallets = useMemo(() => {
    return savedWallets.filter(wallet => wallet.network === selectedWalletType);
  }, [savedWallets, selectedWalletType]);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (filteredWallets.length === 0) {
        setTransactions([]);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      const allTransactions: TransactionWithWallet[] = [];
      
      try {
        // Fetch transactions for each wallet
        for (const wallet of filteredWallets) {
          if (wallet.network === selectedWalletType) {
            try {
              console.log(`[AllWalletsTransactions] Fetching transactions for wallet: ${wallet.label} (${wallet.address})`);
              const walletTransactions = await getAddressTransactions(wallet.address, 50);
              
              // Add wallet information to each transaction
              const transactionsWithWallet = walletTransactions.map(tx => ({
                ...tx,
                walletAddress: wallet.address,
                walletLabel: wallet.label
              }));
              
              allTransactions.push(...transactionsWithWallet);
              console.log(`[AllWalletsTransactions] Fetched ${walletTransactions.length} transactions for ${wallet.label}`);
            } catch (error) {
              console.error(`[AllWalletsTransactions] Error fetching transactions for ${wallet.label}:`, error);
            }
          }
        }
        
        // Remove duplicate transactions (same hash) while preserving wallet information
        // If the same transaction appears for multiple wallets, keep all instances with different wallet info
        const uniqueTransactions = allTransactions.filter((tx, index, array) => {
          // Check if this is the first occurrence of this transaction hash + wallet combination
          return array.findIndex(t => t.hash === tx.hash && t.walletAddress === tx.walletAddress) === index;
        });
        
        // Sort all transactions by timestamp (newest first)
        uniqueTransactions.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        setTransactions(uniqueTransactions);
        console.log(`[AllWalletsTransactions] Total aggregated transactions: ${uniqueTransactions.length} (${allTransactions.length - uniqueTransactions.length} duplicates removed)`);
        
        // Update API status if callback provided
        if (updateApiStatus) {
          updateApiStatus(true, { source: 'explorer' }, {});
        }
      } catch (error) {
        console.error('[AllWalletsTransactions] Error fetching transactions:', error);
        
        // Update API status with error if callback provided
        if (updateApiStatus) {
          updateApiStatus(false, { source: 'error' }, { 
            network: error instanceof Error ? error.message : 'Failed to fetch transactions' 
          });
        }
        
        toast.error("Could not fetch transaction history", {
          description: "Please try again later"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllTransactions();
  }, [filteredWallets]);

  // Helper function to format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Use official Alephium Explorer transaction parsing logic
  const parseTransactionForAddress = (tx: TransactionWithWallet) => {
    // Debug specific transactions (enable for development)
    if (process.env.NODE_ENV === 'development' && Math.random() < 0.01) { // Random 1% debug sampling
      debugTransactionWithOfficialLogic(tx.walletAddress, tx);
    }
    
    return {
      type: getTransactionType(tx.walletAddress, tx),
      amount: getTransactionAmountForDisplay(tx.walletAddress, tx),
      counterparty: getCounterpartyAddress(tx.walletAddress, tx)
    };
  };

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(tx => {
    const parsed = parseTransactionForAddress(tx);
    const walletLabel = tx.walletLabel.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return (
      tx.hash.toLowerCase().includes(searchLower) ||
      parsed.counterparty.toLowerCase().includes(searchLower) ||
      parsed.type.toLowerCase().includes(searchLower) ||
      walletLabel.includes(searchLower)
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

  // Expose debug functions for development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).debugZeroTransactions = (walletAddress?: string) => {
        if (walletAddress) {
          const walletTxs = transactions.filter(tx => tx.walletAddress === walletAddress);
          debugZeroTransactions(walletTxs, walletAddress);
        } else {
          // Debug for all wallets
          filteredWallets.forEach(wallet => {
            const walletTxs = transactions.filter(tx => tx.walletAddress === wallet.address);
            if (walletTxs.length > 0) {
              console.log(`\n=== Wallet: ${wallet.label} (${wallet.address}) ===`);
              debugZeroTransactions(walletTxs, wallet.address);
            }
          });
        }
      };
      (window as any).allWalletTransactions = transactions;
      (window as any).wallets = filteredWallets;
    }
  }, [transactions, filteredWallets]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              All Wallets Transaction History
              <Badge variant="secondary" className="text-xs">
                {sortedTransactions.length} transactions
              </Badge>
            </CardTitle>
            <CardDescription>
              Combined activity from {filteredWallets.length} {selectedWalletType} wallet{filteredWallets.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search transactions or wallets..." 
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
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">
              {searchTerm ? "No transactions match your search" : "No transactions found"}
            </p>
            <p className="text-sm">
              {searchTerm ? "Try a different search term" : `No transaction history available for your ${selectedWalletType} wallets`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wallet</TableHead>
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
                    <TableRow key={`${tx.walletAddress}-${tx.hash}`} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{tx.walletLabel}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {truncateAddress(tx.walletAddress)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
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

export default AllWalletsTransactionsList; 

